import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.client';
import { AppError } from '../../shared/errors/app-error';
import {
  CreatePracticeCollectionDto,
  UpdatePracticeCollectionDto,
  DuplicatePracticeCollectionDto,
  ListPracticeCollectionsQueryDto,
  CreatePracticeVersionDto,
  UpdatePracticeVersionDto,
  CreatePracticeExerciseSetDto,
  UpdatePracticeExerciseSetDto,
  ReorderPracticeItemsDto,
  CreatePracticeQuestionDto,
  UpdatePracticeQuestionDto,
  DuplicatePracticeQuestionDto,
  SubmitPracticeReviewDto,
  RequestPracticeChangesDto,
  PublishPracticeVersionDto,
} from './practice-admin.dto';
import {
  CollectionStatus,
  VersionStatus,
  PublishValidationResult,
  ValidationErrorItem,
  ValidationWarningItem,
} from './practice-admin.types';
import { validatePracticeQuestion, detectAnswerLeakage } from './practice-admin.validation';
import {
  mapCollectionSummary,
  mapVersionDetail,
  mapExerciseSetDetail,
  mapQuestionDetail,
} from './practice-admin.mapper';

export class PracticeAdminService {
  private redactQuestionAuditValue(targetEntity: string, value: any) {
    if (
      targetEntity !== 'PracticeQuestion' ||
      value === null ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return value;
    }

    const redacted = { ...value };
    delete redacted.answer;
    delete redacted.explanation;
    return redacted;
  }

  /**
   * Ghi Audit Log tập trung cho module Practice Admin
   */
  private async recordAuditLog(
    tx: any,
    userId: number,
    actionType: string,
    targetEntity: string,
    targetId: string | number,
    oldValue: any,
    newValue: any,
    ipAddress?: string
  ) {
    try {
      await tx.auditLogs.create({
        data: {
          user_id: userId,
          action_type: actionType,
          target_entity: targetEntity,
          target_id: String(targetId),
          old_value: oldValue
            ? JSON.stringify(this.redactQuestionAuditValue(targetEntity, oldValue))
            : null,
          new_value: newValue
            ? JSON.stringify(this.redactQuestionAuditValue(targetEntity, newValue))
            : null,
          ip_address: ipAddress || null,
        },
      });
    } catch (err) {
      console.error('AuditLog record failed:', err);
    }
  }

  /**
   * Helper kiểm tra version có được phép sửa hay không (chỉ DRAFT hoặc REVISION_REQUIRED)
   */
  private ensureVersionEditable(version: { status: string; id: number }) {
    if (version.status !== 'DRAFT' && version.status !== 'REVISION_REQUIRED') {
      throw AppError.conflict(
        `Không thể sửa nội dung của phiên bản ở trạng thái "${version.status}". Phiên bản đã PUBLISHED hoặc RETIRED là bất biến. Vui lòng tạo Revision mới.`,
        'VERSION_IMMUTABLE'
      );
    }
  }

  /**
   * Helper kiểm tra quyền chỉnh sửa hoặc gửi duyệt của Actor đối với Collection hoặc Version
   * Editor được phép khi:
   * - actor.role === 'ADMIN'
   * - createdById === actor.userId
   * - assignedEditorId === actor.userId
   */
  private checkOwnership(
    actor: { userId: number; role: string },
    resource: {
      createdById: number;
      assignedEditorId?: number | null;
      collection?: { createdById?: number; assignedEditorId?: number | null } | null;
    }
  ): boolean {
    if (actor.role === 'ADMIN') return true;
    if (resource.createdById === actor.userId) return true;
    if (resource.assignedEditorId === actor.userId) return true;
    if (resource.collection && resource.collection.assignedEditorId === actor.userId) return true;
    return false;
  }

  private collectionAccessWhere(actor: { userId: number; role: string }): Prisma.PracticeCollectionWhereInput {
    if (actor.role === 'ADMIN') return {};
    return {
      OR: [
        { createdById: actor.userId },
        { assignedEditorId: actor.userId },
        { versions: { some: { createdById: actor.userId } } },
        { versions: { some: { assignedEditorId: actor.userId } } },
      ],
    };
  }

  private versionAccessWhere(actor: { userId: number; role: string }): Prisma.PracticeCollectionVersionWhereInput {
    if (actor.role === 'ADMIN') return {};
    return {
      OR: [
        { createdById: actor.userId },
        { assignedEditorId: actor.userId },
        { collection: { is: { createdById: actor.userId } } },
        { collection: { is: { assignedEditorId: actor.userId } } },
      ],
    };
  }

  private async assertCollectionAccess(
    collectionId: number,
    actor: { userId: number; role: string }
  ): Promise<void> {
    if (actor.role === 'ADMIN') return;

    const accessibleCollection = await prisma.practiceCollection.findFirst({
      where: {
        id: collectionId,
        ...this.collectionAccessWhere(actor),
      },
      select: { id: true },
    });
    if (accessibleCollection) return;

    const collectionExists = await prisma.practiceCollection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    });
    if (!collectionExists) {
      throw AppError.notFound(`Không tìm thấy bộ đề/bài luyện tập có ID ${collectionId}.`);
    }
    throw AppError.forbidden('Bạn không có quyền truy cập bộ đề/bài luyện tập này.');
  }

  // ==========================================
  // 1. COLLECTIONS
  // ==========================================

  async listCollections(
    query: ListPracticeCollectionsQueryDto,
    actor: { userId: number; role: string }
  ) {
    const { levelCode, category, status, createdBy, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PracticeCollectionWhereInput = {};
    const andConditions: Prisma.PracticeCollectionWhereInput[] = [];

    if (actor.role !== 'ADMIN') {
      andConditions.push(this.collectionAccessWhere(actor));
    }

    if (levelCode) {
      where.level = { code: levelCode };
    }
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (createdBy) {
      andConditions.push({ createdById: createdBy });
    }

    if (search) {
      andConditions.push({
        OR: [
        { code: { contains: search } },
        { titleZh: { contains: search } },
        { titleVi: { contains: search } },
        ],
      });
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const [items, total, draftCount, inReviewCount, revisionRequiredCount, publishedCount, archivedCount] =
      await Promise.all([
        prisma.practiceCollection.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ orderIndex: 'asc' }, { updatedAt: 'desc' }],
          include: {
            level: true,
            createdBy: true,
            updatedBy: true,
            assignedEditor: true,
            reviewedBy: true,
            currentVersion: true,
            _count: { select: { versions: true } },
          },
        }),
        prisma.practiceCollection.count({ where }),
        prisma.practiceCollection.count({ where: { ...where, status: 'DRAFT' } }),
        prisma.practiceCollection.count({ where: { ...where, status: 'IN_REVIEW' } }),
        prisma.practiceCollection.count({ where: { ...where, status: 'REVISION_REQUIRED' } }),
        prisma.practiceCollection.count({ where: { ...where, status: 'PUBLISHED' } }),
        prisma.practiceCollection.count({ where: { ...where, status: 'ARCHIVED' } }),
      ]);

    return {
      items: items.map(mapCollectionSummary),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        draft: draftCount,
        inReview: inReviewCount,
        revisionRequired: revisionRequiredCount,
        published: publishedCount,
        archived: archivedCount,
      },
    };
  }

  async getCollectionById(
    collectionId: number,
    actor: { userId: number; role: string }
  ) {
    const collection = await prisma.practiceCollection.findFirst({
      where: {
        id: collectionId,
        ...this.collectionAccessWhere(actor),
      },
      include: {
        level: true,
        createdBy: true,
        updatedBy: true,
        assignedEditor: true,
        reviewedBy: true,
        currentVersion: {
          include: {
            exerciseSets: {
              include: {
                questions: { orderBy: { sortOrder: 'asc' } },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            createdBy: true,
            updatedBy: true,
            assignedEditor: true,
            reviewedBy: true,
            _count: { select: { exerciseSets: true, attempts: true } },
          },
        },
      },
    });

    if (!collection) {
      if (actor.role !== 'ADMIN') await this.assertCollectionAccess(collectionId, actor);
      throw AppError.notFound(`Không tìm thấy bộ đề/bài luyện tập có ID ${collectionId}.`);
    }

    return {
      ...mapCollectionSummary(collection),
      currentVersion: collection.currentVersion ? mapVersionDetail(collection.currentVersion) : null,
      versions: collection.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        status: v.status,
        changeSummary: v.changeSummary,
        reviewNotes: v.reviewNotes,
        createdById: v.createdById,
        creatorName: v.createdBy?.display_name || v.createdBy?.email,
        publishedAt: v.publishedAt,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        exerciseSetsCount: v._count.exerciseSets,
        attemptsCount: v._count.attempts,
      })),
    };
  }

  async createCollection(
    dto: CreatePracticeCollectionDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    // 1. Kiểm tra level tồn tại
    const level = await prisma.practiceLevel.findUnique({
      where: { id: dto.levelId },
    });
    if (!level) {
      throw AppError.notFound(`Không tìm thấy cấp độ (levelId: ${dto.levelId}).`);
    }

    // 2. Kiểm tra code trùng
    const existing = await prisma.practiceCollection.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw AppError.conflict(`Mã bộ đề "${dto.code}" đã tồn tại.`);
    }

    // 3. Tạo trong transaction: Collection DRAFT + Version 1 DRAFT
    return prisma.$transaction(async (tx) => {
      const collection = await tx.practiceCollection.create({
        data: {
          levelId: dto.levelId,
          code: dto.code,
          category: dto.category,
          titleZh: dto.titleZh,
          titlePinyin: dto.titlePinyin,
          titleVi: dto.titleVi,
          description: dto.description,
          orderIndex: dto.orderIndex,
          status: 'DRAFT',
          createdById: actor.userId,
          updatedById: actor.userId,
        },
      });

      const version = await tx.practiceCollectionVersion.create({
        data: {
          collectionId: collection.id,
          versionNumber: 1,
          status: 'DRAFT',
          changeSummary: 'Khởi tạo bản nháp đầu tiên',
          createdById: actor.userId,
          updatedById: actor.userId,
        },
      });

      await this.recordAuditLog(
        tx,
        actor.userId,
        'CREATE_PRACTICE_COLLECTION',
        'PracticeCollection',
        collection.id,
        null,
        collection,
        ipAddress
      );

      await this.recordAuditLog(
        tx,
        actor.userId,
        'CREATE_PRACTICE_VERSION',
        'PracticeCollectionVersion',
        version.id,
        null,
        version,
        ipAddress
      );

      return {
        collection: mapCollectionSummary(collection),
        initialVersion: mapVersionDetail(version),
      };
    });
  }

  async updateCollection(
    collectionId: number,
    dto: UpdatePracticeCollectionDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const collection = await prisma.practiceCollection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) {
      throw AppError.notFound(`Không tìm thấy bộ sưu tập có ID ${collectionId}.`);
    }

    // Quyền: Content Editor chỉ sửa được collection của mình hoặc được assign
    if (!this.checkOwnership(actor, collection)) {
      throw AppError.forbidden('Bạn chỉ có thể chỉnh sửa bộ sưu tập do chính bạn tạo hoặc được phân công.');
    }

    // Optimistic concurrency check
    const currentUpdatedAt = collection.updatedAt.toISOString();
    const expectedUpdatedAt = new Date(dto.expectedUpdatedAt).toISOString();
    if (currentUpdatedAt !== expectedUpdatedAt) {
      throw AppError.conflict(
        'Nội dung đã được người khác cập nhật. Vui lòng tải lại trang.',
        'EDIT_CONFLICT'
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.practiceCollection.update({
        where: { id: collectionId },
        data: {
          titleZh: dto.titleZh ?? collection.titleZh,
          titlePinyin: dto.titlePinyin !== undefined ? dto.titlePinyin : collection.titlePinyin,
          titleVi: dto.titleVi ?? collection.titleVi,
          description: dto.description !== undefined ? dto.description : collection.description,
          orderIndex: dto.orderIndex ?? collection.orderIndex,
          updatedById: actor.userId,
        },
        include: { level: true, createdBy: true, updatedBy: true },
      });

      await this.recordAuditLog(
        tx,
        actor.userId,
        'UPDATE_PRACTICE_COLLECTION',
        'PracticeCollection',
        collectionId,
        collection,
        updated,
        ipAddress
      );

      return mapCollectionSummary(updated);
    });
  }

  async assignEditor(
    collectionId: number,
    editorId: number,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    if (actor.role !== 'ADMIN') {
      throw AppError.forbidden('Chỉ Quản trị viên (ADMIN) mới có quyền phân công biên tập viên.');
    }

    const editor = await prisma.users.findUnique({
      where: { user_id: editorId },
    });
    if (!editor || (editor.role !== 'CONTENT_EDITOR' && editor.role !== 'ADMIN')) {
      throw AppError.badRequest('Người dùng được phân công phải có vai trò CONTENT_EDITOR hoặc ADMIN.');
    }

    const collection = await prisma.practiceCollection.findUnique({
      where: { id: collectionId },
      include: {
        versions: {
          where: { status: { in: ['DRAFT', 'REVISION_REQUIRED'] } },
        },
      },
    });
    if (!collection) {
      throw AppError.notFound(`Không tìm thấy bộ sưu tập ID ${collectionId}.`);
    }

    const oldEditorId = collection.assignedEditorId;

    return prisma.$transaction(async (tx) => {
      // 1. Cập nhật assignedEditorId của Collection (KHÔNG ghi đè createdById)
      const updatedCollection = await tx.practiceCollection.update({
        where: { id: collectionId },
        data: {
          assignedEditorId: editorId,
          updatedById: actor.userId,
        },
        include: { level: true, createdBy: true, updatedBy: true, assignedEditor: true },
      });

      // 2. Cập nhật assignedEditorId cho các version DRAFT / REVISION_REQUIRED
      // KHÔNG gán cho PUBLISHED hoặc RETIRED
      await tx.practiceCollectionVersion.updateMany({
        where: {
          collectionId,
          status: { in: ['DRAFT', 'REVISION_REQUIRED'] },
        },
        data: {
          assignedEditorId: editorId,
          updatedById: actor.userId,
        },
      });

      await this.recordAuditLog(
        tx,
        actor.userId,
        'ASSIGN_PRACTICE_EDITOR',
        'PracticeCollection',
        collectionId,
        { oldEditorId },
        { newEditorId: editorId },
        ipAddress
      );

      return mapCollectionSummary(updatedCollection);
    });
  }

  async duplicateCollection(
    collectionId: number,
    dto: DuplicatePracticeCollectionDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const sourceCollection = await prisma.practiceCollection.findUnique({
      where: { id: collectionId },
      include: {
        currentVersion: true,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });
    if (!sourceCollection) {
      throw AppError.notFound(`Không tìm thấy bộ sưu tập nguồn ID ${collectionId}.`);
    }

    // Kiểm tra code mới
    const existing = await prisma.practiceCollection.findUnique({
      where: { code: dto.newCode },
    });
    if (existing) {
      throw AppError.conflict(`Mã bộ đề "${dto.newCode}" đã tồn tại.`);
    }

    // Chọn version để clone (ưu tiên sourceVersionId được chỉ định, hoặc currentVersion, hoặc version mới nhất)
    const versionToCloneId =
      dto.sourceVersionId ||
      sourceCollection.currentVersionId ||
      sourceCollection.versions[0]?.id;

    if (!versionToCloneId) {
      throw AppError.badRequest('Bộ sưu tập nguồn không có phiên bản nào để nhân bản.');
    }

    const sourceVersion = await prisma.practiceCollectionVersion.findUnique({
      where: { id: versionToCloneId },
      include: {
        exerciseSets: {
          include: {
            questions: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!sourceVersion) {
      throw AppError.notFound(`Không tìm thấy phiên bản nguồn ID ${versionToCloneId}.`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Tạo collection mới DRAFT
      const newCollection = await tx.practiceCollection.create({
        data: {
          levelId: sourceCollection.levelId,
          code: dto.newCode,
          category: sourceCollection.category,
          titleZh: sourceCollection.titleZh,
          titlePinyin: sourceCollection.titlePinyin,
          titleVi: dto.titleVi || `${sourceCollection.titleVi} (Bản sao)`,
          description: sourceCollection.description,
          orderIndex: sourceCollection.orderIndex + 1,
          status: 'DRAFT',
          createdById: actor.userId,
          updatedById: actor.userId,
        },
      });

      // 2. Tạo Version 1 DRAFT cho collection mới
      const newVersion = await tx.practiceCollectionVersion.create({
        data: {
          collectionId: newCollection.id,
          versionNumber: 1,
          status: 'DRAFT',
          changeSummary: `Nhân bản từ ${sourceCollection.code} (Version ${sourceVersion.versionNumber})`,
          createdById: actor.userId,
          updatedById: actor.userId,
        },
      });

      // 3. Deep clone exercise sets & questions
      for (const set of sourceVersion.exerciseSets) {
        const newSetCode = `${dto.newCode}-${set.skill}-${Date.now().toString().slice(-4)}`;
        const newSet = await tx.practiceExerciseSet.create({
          data: {
            versionId: newVersion.id,
            code: newSetCode,
            skill: set.skill,
            titleZh: set.titleZh,
            titleVi: set.titleVi,
            instructions: set.instructions,
            sortOrder: set.sortOrder,
            status: 'PUBLISHED',
            isPublished: true,
            estimatedMinutes: set.estimatedMinutes,
            audioUrl: set.audioUrl,
          },
        });

        for (const q of set.questions) {
          const newQCode = `${newSetCode}-Q${String(q.sortOrder).padStart(2, '0')}`;
          await tx.practiceQuestion.create({
            data: {
              exerciseSetId: newSet.id,
              code: newQCode,
              type: q.type,
              prompt: q.prompt,
              answer: q.answer,
              explanation: q.explanation,
              score: q.score,
              sortOrder: q.sortOrder,
              status: 'PUBLISHED',
              sourcePage: q.sourcePage,
              sourceAudio: q.sourceAudio,
            },
          });
        }
      }

      await this.recordAuditLog(
        tx,
        actor.userId,
        'DUPLICATE_PRACTICE_COLLECTION',
        'PracticeCollection',
        newCollection.id,
        { sourceCollectionId: collectionId, sourceVersionId: versionToCloneId },
        newCollection,
        ipAddress
      );

      return {
        collection: mapCollectionSummary(newCollection),
        initialVersionId: newVersion.id,
      };
    });
  }

  async archiveCollection(collectionId: number, actor: { userId: number; role: string }, ipAddress?: string) {
    if (actor.role !== 'ADMIN') {
      throw AppError.forbidden('Chỉ Quản trị viên (ADMIN) mới có quyền lưu trữ (Archive) bộ sưu tập.');
    }

    const collection = await prisma.practiceCollection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) {
      throw AppError.notFound(`Không tìm thấy bộ sưu tập ID ${collectionId}.`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.practiceCollection.update({
        where: { id: collectionId },
        data: {
          status: 'ARCHIVED',
          updatedById: actor.userId,
        },
      });

      await this.recordAuditLog(
        tx,
        actor.userId,
        'ARCHIVE_PRACTICE_COLLECTION',
        'PracticeCollection',
        collectionId,
        collection,
        updated,
        ipAddress
      );

      return mapCollectionSummary(updated);
    });
  }

  // ==========================================
  // 2. VERSIONS
  // ==========================================

  async getVersionsByCollection(
    collectionId: number,
    actor: { userId: number; role: string }
  ) {
    await this.assertCollectionAccess(collectionId, actor);
    const collection = await prisma.practiceCollection.findUnique({
      where: { id: collectionId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            createdBy: true,
            updatedBy: true,
            reviewedBy: true,
            _count: { select: { exerciseSets: true, attempts: true } },
          },
        },
      },
    });

    if (!collection) {
      throw AppError.notFound(`Không tìm thấy bộ sưu tập ID ${collectionId}.`);
    }

    return collection.versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      status: v.status,
      changeSummary: v.changeSummary,
      reviewNotes: v.reviewNotes,
      createdById: v.createdById,
      creatorName: v.createdBy?.display_name || v.createdBy?.email,
      reviewedById: v.reviewedById,
      reviewerName: v.reviewedBy?.display_name || v.reviewedBy?.email,
      reviewedAt: v.reviewedAt,
      publishedAt: v.publishedAt,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      exerciseSetsCount: v._count.exerciseSets,
      attemptsCount: v._count.attempts,
    }));
  }

  async getVersionDetail(
    versionId: number,
    actor: { userId: number; role: string }
  ) {
    const version = await prisma.practiceCollectionVersion.findFirst({
      where: {
        id: versionId,
        ...this.versionAccessWhere(actor),
      },
      include: {
        collection: true,
        createdBy: true,
        updatedBy: true,
        reviewedBy: true,
        exerciseSets: {
          include: {
            questions: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!version) {
      const versionExists = await prisma.practiceCollectionVersion.findUnique({
        where: { id: versionId },
        select: { id: true },
      });
      if (!versionExists) {
        throw AppError.notFound(`Không tìm thấy phiên bản ID ${versionId}.`);
      }
      throw AppError.forbidden('Bạn không có quyền truy cập phiên bản này.');
    }

    return mapVersionDetail(version);
  }

  async createVersionRevision(
    collectionId: number,
    dto: CreatePracticeVersionDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const collection = await prisma.practiceCollection.findUnique({
      where: { id: collectionId },
      include: {
        currentVersion: true,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });

    if (!collection) {
      throw AppError.notFound(`Không tìm thấy bộ sưu tập ID ${collectionId}.`);
    }

    if (!this.checkOwnership(actor, collection)) {
      throw AppError.forbidden('Bạn không thể tạo revision cho bộ sưu tập của người khác.');
    }

    // Xác định version nguồn để clone
    const sourceVersionId =
      dto.sourceVersionId ||
      collection.currentVersionId ||
      collection.versions[0]?.id;

    let sourceVersion = null;
    if (sourceVersionId) {
      sourceVersion = await prisma.practiceCollectionVersion.findUnique({
        where: { id: sourceVersionId },
        include: {
          exerciseSets: {
            include: {
              questions: { orderBy: { sortOrder: 'asc' } },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    }

    const nextVersionNumber = (collection.versions[0]?.versionNumber || 0) + 1;

    return prisma.$transaction(async (tx) => {
      // 1. Tạo Version DRAFT mới
      const newVersion = await tx.practiceCollectionVersion.create({
        data: {
          collectionId,
          versionNumber: nextVersionNumber,
          status: 'DRAFT',
          changeSummary: dto.changeSummary,
          createdById: actor.userId,
          updatedById: actor.userId,
        },
      });

      // 2. Clone sets & questions từ sourceVersion (nếu có)
      if (sourceVersion && sourceVersion.exerciseSets.length > 0) {
        for (const set of sourceVersion.exerciseSets) {
          const newSetCode = `${set.code}-V${nextVersionNumber}`;
          const newSet = await tx.practiceExerciseSet.create({
            data: {
              versionId: newVersion.id,
              code: newSetCode,
              skill: set.skill,
              titleZh: set.titleZh,
              titleVi: set.titleVi,
              instructions: set.instructions,
              sortOrder: set.sortOrder,
              status: 'PUBLISHED',
              isPublished: true,
              estimatedMinutes: set.estimatedMinutes,
              audioUrl: set.audioUrl,
            },
          });

          for (const q of set.questions) {
            const newQCode = `${newSetCode}-Q${String(q.sortOrder).padStart(2, '0')}`;
            await tx.practiceQuestion.create({
              data: {
                exerciseSetId: newSet.id,
                code: newQCode,
                type: q.type,
                prompt: q.prompt,
                answer: q.answer,
                explanation: q.explanation,
                score: q.score,
                sortOrder: q.sortOrder,
                status: 'PUBLISHED',
                sourcePage: q.sourcePage,
                sourceAudio: q.sourceAudio,
              },
            });
          }
        }
      }

      await this.recordAuditLog(
        tx,
        actor.userId,
        'CREATE_PRACTICE_VERSION',
        'PracticeCollectionVersion',
        newVersion.id,
        { sourceVersionId },
        newVersion,
        ipAddress
      );

      return mapVersionDetail(newVersion);
    });
  }

  async updateVersion(
    versionId: number,
    dto: UpdatePracticeVersionDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const version = await prisma.practiceCollectionVersion.findUnique({
      where: { id: versionId },
      include: { collection: true },
    });
    if (!version) {
      throw AppError.notFound(`Không tìm thấy phiên bản ID ${versionId}.`);
    }

    this.ensureVersionEditable(version);

    if (!this.checkOwnership(actor, version)) {
      throw AppError.forbidden('Bạn chỉ có quyền sửa bản nháp do chính bạn tạo hoặc được phân công.');
    }

    // Optimistic concurrency check
    const currentUpdatedAt = version.updatedAt.toISOString();
    const expectedUpdatedAt = new Date(dto.expectedUpdatedAt).toISOString();
    if (currentUpdatedAt !== expectedUpdatedAt) {
      throw AppError.conflict(
        'Nội dung phiên bản đã được người khác cập nhật. Vui lòng tải lại.',
        'EDIT_CONFLICT'
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.practiceCollectionVersion.update({
        where: { id: versionId },
        data: {
          changeSummary: dto.changeSummary ?? version.changeSummary,
          updatedById: actor.userId,
        },
      });

      await this.recordAuditLog(
        tx,
        actor.userId,
        'UPDATE_PRACTICE_VERSION',
        'PracticeCollectionVersion',
        versionId,
        version,
        updated,
        ipAddress
      );

      return mapVersionDetail(updated);
    });
  }

  // ==========================================
  // 3. WORKFLOW TRANSITIONS
  // ==========================================

  async validateVersion(versionId: number): Promise<PublishValidationResult> {
    const version = await prisma.practiceCollectionVersion.findUnique({
      where: { id: versionId },
      include: {
        collection: true,
        exerciseSets: {
          include: {
            questions: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!version) {
      throw AppError.notFound(`Không tìm thấy phiên bản ID ${versionId}.`);
    }

    const errors: ValidationErrorItem[] = [];
    const warnings: ValidationWarningItem[] = [];

    // 1. Kiểm tra tập hợp exercise sets
    if (version.exerciseSets.length === 0) {
      errors.push({
        entityType: 'VERSION',
        entityId: version.id,
        field: 'exerciseSets',
        code: 'EMPTY_EXERCISE_SETS',
        message: 'Phiên bản chưa có phần thi (Exercise Set) nào.',
      });
    }

    let totalQuestionsCount = 0;
    let totalScore = 0;

    for (const set of version.exerciseSets) {
      if (set.questions.length === 0) {
        errors.push({
          entityType: 'EXERCISE_SET',
          entityId: set.id,
          field: 'questions',
          code: 'EMPTY_QUESTIONS',
          message: `Phần bài tập "${set.titleZh}" (${set.code}) chưa có câu hỏi nào.`,
        });
      }

      totalQuestionsCount += set.questions.length;

      // Kiểm tra trùng sortOrder trong cùng exercise set
      const orderSet = new Set<number>();
      for (const q of set.questions) {
        if (orderSet.has(q.sortOrder)) {
          warnings.push({
            entityType: 'QUESTION',
            entityId: q.id,
            field: 'sortOrder',
            code: 'DUPLICATE_SORT_ORDER',
            message: `Trùng thứ tự câu hỏi (sortOrder: ${q.sortOrder}) trong phần thi ${set.code}.`,
          });
        }
        orderSet.add(q.sortOrder);

        // Validate type & structure & leak
        let parsedPrompt: any = {};
        try {
          parsedPrompt = JSON.parse(q.prompt);
        } catch {
          errors.push({
            entityType: 'QUESTION',
            entityId: q.id,
            field: 'prompt',
            code: 'INVALID_JSON',
            message: `Prompt của câu hỏi ${q.code} không phải JSON hợp lệ.`,
          });
        }

        let parsedAnswer: any = {};
        try {
          parsedAnswer = JSON.parse(q.answer);
        } catch {
          errors.push({
            entityType: 'QUESTION',
            entityId: q.id,
            field: 'answer',
            code: 'INVALID_JSON',
            message: `Answer của câu hỏi ${q.code} không phải JSON hợp lệ.`,
          });
        }

        const validation = validatePracticeQuestion(q.type, parsedPrompt, parsedAnswer);
        if (!validation.valid) {
          errors.push({
            entityType: 'QUESTION',
            entityId: q.id,
            field: 'validation',
            code: 'QUESTION_STRUCTURE_INVALID',
            message: `Câu hỏi ${q.code}: ${validation.error}`,
          });
        }

        totalScore += q.score;
      }
    }

    if (totalQuestionsCount > 0 && totalScore <= 0) {
      errors.push({
        entityType: 'VERSION',
        entityId: version.id,
        field: 'score',
        code: 'TOTAL_SCORE_INVALID',
        message: 'Tổng điểm số của phiên bản phải lớn hơn 0.',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async submitForReview(
    versionId: number,
    dto: SubmitPracticeReviewDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const version = await prisma.practiceCollectionVersion.findUnique({
      where: { id: versionId },
      include: { collection: true },
    });
    if (!version) {
      throw AppError.notFound(`Không tìm thấy phiên bản ID ${versionId}.`);
    }

    if (version.status !== 'DRAFT' && version.status !== 'REVISION_REQUIRED') {
      throw AppError.conflict(
        `Không thể gửi duyệt phiên bản đang ở trạng thái "${version.status}". Chỉ cho phép gửi duyệt từ DRAFT hoặc REVISION_REQUIRED.`,
        'INVALID_TRANSITION'
      );
    }

    if (!this.checkOwnership(actor, version)) {
      throw AppError.forbidden('Bạn chỉ có quyền gửi duyệt phiên bản do bạn tạo hoặc được phân công.');
    }

    // Server-side validation trước khi submit review
    const validation = await this.validateVersion(versionId);
    if (!validation.valid) {
      throw AppError.badRequest(
        `Không thể gửi duyệt: Phiên bản còn ${validation.errors.length} lỗi cần sửa.`,
        'VALIDATION_FAILED',
        validation.errors
      );
    }

    return prisma.$transaction(async (tx) => {
      const updatedVersion = await tx.practiceCollectionVersion.update({
        where: { id: versionId },
        data: {
          status: 'IN_REVIEW',
          reviewNotes: dto.reviewNotes || null,
          updatedById: actor.userId,
        },
      });

      await tx.practiceCollection.update({
        where: { id: version.collectionId },
        data: {
          status: 'IN_REVIEW',
          updatedById: actor.userId,
        },
      });

      await this.recordAuditLog(
        tx,
        actor.userId,
        'SUBMIT_PRACTICE_FOR_REVIEW',
        'PracticeCollectionVersion',
        versionId,
        version,
        updatedVersion,
        ipAddress
      );

      return mapVersionDetail(updatedVersion);
    });
  }

  async requestChanges(
    versionId: number,
    dto: RequestPracticeChangesDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    if (actor.role !== 'ADMIN') {
      throw AppError.forbidden('Chỉ Quản trị viên (ADMIN) mới có quyền yêu cầu chỉnh sửa (Request Changes).');
    }

    const version = await prisma.practiceCollectionVersion.findUnique({
      where: { id: versionId },
      include: { collection: true },
    });
    if (!version) {
      throw AppError.notFound(`Không tìm thấy phiên bản ID ${versionId}.`);
    }

    if (version.status !== 'IN_REVIEW') {
      throw AppError.conflict(
        `Chỉ có thể yêu cầu sửa đổi phiên bản đang ở trạng thái "IN_REVIEW". Hiện tại là "${version.status}".`,
        'INVALID_TRANSITION'
      );
    }

    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const updatedVersion = await tx.practiceCollectionVersion.update({
        where: { id: versionId },
        data: {
          status: 'REVISION_REQUIRED',
          reviewNotes: dto.reviewNote,
          reviewedById: actor.userId,
          reviewedAt: now,
          updatedById: actor.userId,
        },
      });

      await tx.practiceCollection.update({
        where: { id: version.collectionId },
        data: {
          status: 'REVISION_REQUIRED',
          reviewedById: actor.userId,
          reviewedAt: now,
          updatedById: actor.userId,
        },
      });

      await this.recordAuditLog(
        tx,
        actor.userId,
        'REQUEST_PRACTICE_CHANGES',
        'PracticeCollectionVersion',
        versionId,
        version,
        updatedVersion,
        ipAddress
      );

      return mapVersionDetail(updatedVersion);
    });
  }

  async publishVersion(
    versionId: number,
    dto: PublishPracticeVersionDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    if (actor.role !== 'ADMIN') {
      throw AppError.forbidden('Chỉ Quản trị viên (ADMIN) mới có quyền xuất bản (Publish) bài luyện tập.');
    }

    const version = await prisma.practiceCollectionVersion.findUnique({
      where: { id: versionId },
      include: { collection: true },
    });
    if (!version) {
      throw AppError.notFound(`Không tìm thấy phiên bản ID ${versionId}.`);
    }

    if (version.status !== 'IN_REVIEW') {
      throw AppError.conflict(
        `Chỉ có thể xuất bản phiên bản đang ở trạng thái "IN_REVIEW". Phiên bản hiện tại là "${version.status}".`,
        'INVALID_TRANSITION'
      );
    }

    // Validate lại toàn bộ trước khi xuất bản
    const validation = await this.validateVersion(versionId);
    if (!validation.valid) {
      throw AppError.badRequest(
        `Không thể xuất bản: Phiên bản còn ${validation.errors.length} lỗi không đạt chuẩn.`,
        'VALIDATION_FAILED',
        validation.errors
      );
    }

    const now = new Date();

    return prisma.$transaction(async (tx) => {
      // 1. Chuyển version PUBLISHED hiện tại của collection thành RETIRED (nếu có)
      await tx.practiceCollectionVersion.updateMany({
        where: {
          collectionId: version.collectionId,
          status: 'PUBLISHED',
          id: { not: versionId },
        },
        data: {
          status: 'RETIRED',
          updatedById: actor.userId,
        },
      });

      // 2. Cập nhật version này thành PUBLISHED
      const publishedVersion = await tx.practiceCollectionVersion.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
          reviewedById: actor.userId,
          reviewedAt: now,
          publishedAt: now,
          updatedById: actor.userId,
        },
      });

      // 3. Cập nhật Collection thành PUBLISHED và trỏ currentVersionId
      await tx.practiceCollection.update({
        where: { id: version.collectionId },
        data: {
          status: 'PUBLISHED',
          currentVersionId: publishedVersion.id,
          reviewedById: actor.userId,
          reviewedAt: now,
          publishedAt: now,
          updatedById: actor.userId,
        },
      });

      // 4. Kích hoạt xuất bản tất cả exercise sets và questions thuộc version này
      await tx.practiceExerciseSet.updateMany({
        where: { versionId: publishedVersion.id },
        data: {
          isPublished: true,
          status: 'PUBLISHED',
        },
      });

      await tx.practiceQuestion.updateMany({
        where: { exerciseSet: { versionId: publishedVersion.id } },
        data: {
          status: 'PUBLISHED',
        },
      });

      await this.recordAuditLog(
        tx,
        actor.userId,
        'PUBLISH_PRACTICE_VERSION',
        'PracticeCollectionVersion',
        versionId,
        version,
        publishedVersion,
        ipAddress
      );

      return mapVersionDetail(publishedVersion);
    });
  }

  async retireVersion(versionId: number, actor: { userId: number; role: string }, ipAddress?: string) {
    if (actor.role !== 'ADMIN') {
      throw AppError.forbidden('Chỉ Quản trị viên (ADMIN) mới có quyền gỡ bỏ (Retire) phiên bản.');
    }

    const version = await prisma.practiceCollectionVersion.findUnique({
      where: { id: versionId },
      include: { collection: true },
    });
    if (!version) {
      throw AppError.notFound(`Không tìm thấy phiên bản ID ${versionId}.`);
    }

    return prisma.$transaction(async (tx) => {
      const retired = await tx.practiceCollectionVersion.update({
        where: { id: versionId },
        data: {
          status: 'RETIRED',
          updatedById: actor.userId,
        },
      });

      // Nếu version này đang là currentVersion của collection thì gỡ currentVersionId và đưa collection về DRAFT
      if (version.collection.currentVersionId === versionId) {
        await tx.practiceCollection.update({
          where: { id: version.collectionId },
          data: {
            currentVersionId: null,
            status: 'DRAFT',
            updatedById: actor.userId,
          },
        });
      }

      await this.recordAuditLog(
        tx,
        actor.userId,
        'RETIRE_PRACTICE_VERSION',
        'PracticeCollectionVersion',
        versionId,
        version,
        retired,
        ipAddress
      );

      return mapVersionDetail(retired);
    });
  }

  async previewVersion(
    versionId: number,
    actor: { userId: number; role: string },
    showAnswers: boolean = false
  ) {
    const version = await prisma.practiceCollectionVersion.findFirst({
      where: {
        id: versionId,
        ...this.versionAccessWhere(actor),
      },
      include: {
        collection: { include: { level: true } },
        exerciseSets: {
          include: {
            questions: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!version) {
      const versionExists = await prisma.practiceCollectionVersion.findUnique({
        where: { id: versionId },
        select: { id: true },
      });
      if (!versionExists) {
        throw AppError.notFound(`Không tìm thấy phiên bản ID ${versionId}.`);
      }
      throw AppError.forbidden('Bạn không có quyền truy cập phiên bản này.');
    }

    return {
      versionId: version.id,
      versionNumber: version.versionNumber,
      status: version.status,
      collection: {
        id: version.collection.id,
        code: version.collection.code,
        category: version.collection.category,
        titleZh: version.collection.titleZh,
        titleVi: version.collection.titleVi,
        level: version.collection.level.code,
      },
      exerciseSets: version.exerciseSets.map((set) => ({
        id: set.id,
        code: set.code,
        skill: set.skill,
        titleZh: set.titleZh,
        titleVi: set.titleVi,
        instructions: set.instructions,
        sortOrder: set.sortOrder,
        audioUrl: set.audioUrl,
        questions: set.questions.map((q) => {
          let parsedPrompt: any = q.prompt;
          try {
            parsedPrompt = JSON.parse(q.prompt);
          } catch {}

          let parsedAnswer: any = undefined;
          let parsedExplanation: any = undefined;

          if (showAnswers) {
            try {
              parsedAnswer = JSON.parse(q.answer);
            } catch {
              parsedAnswer = q.answer;
            }
            if (q.explanation) {
              try {
                parsedExplanation = JSON.parse(q.explanation);
              } catch {
                parsedExplanation = q.explanation;
              }
            }
          }

          return {
            id: q.id,
            code: q.code,
            type: q.type,
            score: q.score,
            sortOrder: q.sortOrder,
            prompt: parsedPrompt,
            ...(showAnswers && {
              answer: parsedAnswer,
              explanation: parsedExplanation,
            }),
          };
        }),
      })),
    };
  }

  // ==========================================
  // 4. EXERCISE SETS
  // ==========================================

  async createExerciseSet(
    versionId: number,
    dto: CreatePracticeExerciseSetDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const version = await prisma.practiceCollectionVersion.findUnique({
      where: { id: versionId },
      include: {
        collection: true,
        exerciseSets: { orderBy: { sortOrder: 'desc' } },
      },
    });
    if (!version) {
      throw AppError.notFound(`Không tìm thấy phiên bản ID ${versionId}.`);
    }

    this.ensureVersionEditable(version);

    if (!this.checkOwnership(actor, version)) {
      throw AppError.forbidden('Bạn không thể thêm phần thi vào phiên bản của người khác.');
    }

    const existingCode = await prisma.practiceExerciseSet.findUnique({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw AppError.conflict(`Mã phần thi "${dto.code}" đã tồn tại trong hệ thống.`);
    }

    const nextSortOrder = dto.sortOrder || (version.exerciseSets[0]?.sortOrder || 0) + 1;

    return prisma.$transaction(async (tx) => {
      const set = await tx.practiceExerciseSet.create({
        data: {
          versionId,
          code: dto.code,
          skill: dto.skill,
          titleZh: dto.titleZh,
          titleVi: dto.titleVi,
          instructions: dto.instructions,
          estimatedMinutes: dto.estimatedMinutes,
          audioUrl: dto.audioUrl,
          sortOrder: nextSortOrder,
        },
      });

      // Cập nhật updatedAt của version làm concurrency token
      await tx.practiceCollectionVersion.update({
        where: { id: versionId },
        data: { updatedById: actor.userId },
      });

      await this.recordAuditLog(
        tx,
        actor.userId,
        'CREATE_PRACTICE_EXERCISE_SET',
        'PracticeExerciseSet',
        set.id,
        null,
        set,
        ipAddress
      );

      return mapExerciseSetDetail(set);
    });
  }

  async updateExerciseSet(
    exerciseSetId: number,
    dto: UpdatePracticeExerciseSetDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const set = await prisma.practiceExerciseSet.findUnique({
      where: { id: exerciseSetId },
      include: { version: { include: { collection: true } } },
    });
    if (!set) {
      throw AppError.notFound(`Không tìm thấy phần bài tập ID ${exerciseSetId}.`);
    }

    if (set.version) {
      this.ensureVersionEditable(set.version);
      if (!this.checkOwnership(actor, set.version)) {
        throw AppError.forbidden('Bạn chỉ có quyền sửa phần bài tập trong bản nháp của mình hoặc được phân công.');
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.practiceExerciseSet.update({
        where: { id: exerciseSetId },
        data: {
          titleZh: dto.titleZh ?? set.titleZh,
          titleVi: dto.titleVi !== undefined ? dto.titleVi : set.titleVi,
          instructions: dto.instructions !== undefined ? dto.instructions : set.instructions,
          estimatedMinutes: dto.estimatedMinutes ?? set.estimatedMinutes,
          audioUrl: dto.audioUrl !== undefined ? dto.audioUrl : set.audioUrl,
          sortOrder: dto.sortOrder ?? set.sortOrder,
        },
      });

      if (set.versionId) {
        await tx.practiceCollectionVersion.update({
          where: { id: set.versionId },
          data: { updatedById: actor.userId },
        });
      }

      await this.recordAuditLog(
        tx,
        actor.userId,
        'UPDATE_PRACTICE_EXERCISE_SET',
        'PracticeExerciseSet',
        exerciseSetId,
        set,
        updated,
        ipAddress
      );

      return mapExerciseSetDetail(updated);
    });
  }

  async deleteExerciseSet(exerciseSetId: number, actor: { userId: number; role: string }, ipAddress?: string) {
    const set = await prisma.practiceExerciseSet.findUnique({
      where: { id: exerciseSetId },
      include: {
        version: { include: { collection: true } },
        _count: { select: { attempts: true, questions: true } },
      },
    });
    if (!set) {
      throw AppError.notFound(`Không tìm thấy phần bài tập ID ${exerciseSetId}.`);
    }

    if (set.version) {
      this.ensureVersionEditable(set.version);
      if (!this.checkOwnership(actor, set.version)) {
        throw AppError.forbidden('Bạn không thể xóa phần bài tập trong bản nháp của người khác.');
      }
    }

    if (set._count.attempts > 0) {
      throw AppError.conflict(
        `Không thể xóa phần bài tập này vì đã có ${set._count.attempts} lượt làm bài (attempts). Hãy lưu trữ hoặc tạo revision mới.`,
        'SET_HAS_ATTEMPTS'
      );
    }

    return prisma.$transaction(async (tx) => {
      // Xóa các câu hỏi con trước
      await tx.practiceQuestion.deleteMany({
        where: { exerciseSetId },
      });

      const deleted = await tx.practiceExerciseSet.delete({
        where: { id: exerciseSetId },
      });

      if (set.versionId) {
        await tx.practiceCollectionVersion.update({
          where: { id: set.versionId },
          data: { updatedById: actor.userId },
        });
      }

      await this.recordAuditLog(
        tx,
        actor.userId,
        'DELETE_PRACTICE_EXERCISE_SET',
        'PracticeExerciseSet',
        exerciseSetId,
        set,
        null,
        ipAddress
      );

      return { success: true, message: 'Đã xóa phần bài tập thành công.' };
    });
  }

  async reorderExerciseSets(
    versionId: number,
    dto: ReorderPracticeItemsDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const version = await prisma.practiceCollectionVersion.findUnique({
      where: { id: versionId },
      include: { collection: true, exerciseSets: true },
    });
    if (!version) {
      throw AppError.notFound(`Không tìm thấy phiên bản ID ${versionId}.`);
    }

    this.ensureVersionEditable(version);

    if (!this.checkOwnership(actor, version)) {
      throw AppError.forbidden('Bạn chỉ có quyền sắp xếp trong bản nháp của mình hoặc được phân công.');
    }

    const versionSetIds = new Set(version.exerciseSets.map((s) => s.id));
    for (const item of dto.items) {
      if (!versionSetIds.has(item.id)) {
        throw AppError.badRequest(`Phần thi ID ${item.id} không thuộc phiên bản ID ${versionId}.`);
      }
    }

    const sortOrders = dto.items.map((i) => i.sortOrder);
    if (new Set(sortOrders).size !== sortOrders.length) {
      throw AppError.badRequest('Giá trị sortOrder không được trùng lặp.');
    }

    return prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        await tx.practiceExerciseSet.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        });
      }

      await tx.practiceCollectionVersion.update({
        where: { id: versionId },
        data: { updatedById: actor.userId },
      });

      await this.recordAuditLog(
        tx,
        actor.userId,
        'REORDER_PRACTICE_EXERCISE_SETS',
        'PracticeCollectionVersion',
        versionId,
        null,
        dto.items,
        ipAddress
      );

      return { success: true, message: 'Đã sắp xếp lại thứ tự các phần thi thành công.' };
    });
  }

  // ==========================================
  // 5. QUESTIONS
  // ==========================================

  async createQuestion(
    exerciseSetId: number,
    dto: CreatePracticeQuestionDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const set = await prisma.practiceExerciseSet.findUnique({
      where: { id: exerciseSetId },
      include: {
        version: { include: { collection: true } },
        questions: { orderBy: { sortOrder: 'desc' } },
      },
    });
    if (!set) {
      throw AppError.notFound(`Không tìm thấy phần bài tập ID ${exerciseSetId}.`);
    }

    if (set.version) {
      this.ensureVersionEditable(set.version);
      if (!this.checkOwnership(actor, set.version)) {
        throw AppError.forbidden('Bạn không thể thêm câu hỏi vào bản nháp của người khác.');
      }
    }

    // Code unique check
    const existingCode = await prisma.practiceQuestion.findUnique({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw AppError.conflict(`Mã câu hỏi "${dto.code}" đã tồn tại.`);
    }

    // Validation type và leak
    const validation = validatePracticeQuestion(dto.type, dto.prompt, dto.answer);
    if (!validation.valid) {
      throw AppError.badRequest(validation.error || 'Dữ liệu câu hỏi không hợp lệ.');
    }

    const nextSortOrder = dto.sortOrder || (set.questions[0]?.sortOrder || 0) + 1;

    return prisma.$transaction(async (tx) => {
      const q = await tx.practiceQuestion.create({
        data: {
          exerciseSetId,
          code: dto.code,
          type: dto.type,
          prompt: JSON.stringify(dto.prompt),
          answer: JSON.stringify(dto.answer),
          explanation: dto.explanation ? JSON.stringify(dto.explanation) : null,
          score: dto.score,
          sortOrder: nextSortOrder,
          status: 'PUBLISHED',
          sourcePage: dto.sourcePage,
          sourceAudio: dto.sourceAudio,
        },
      });

      if (set.versionId) {
        await tx.practiceCollectionVersion.update({
          where: { id: set.versionId },
          data: { updatedById: actor.userId },
        });
      }

      await this.recordAuditLog(
        tx,
        actor.userId,
        'CREATE_PRACTICE_QUESTION',
        'PracticeQuestion',
        q.id,
        null,
        q,
        ipAddress
      );

      return mapQuestionDetail(q);
    });
  }

  async updateQuestion(
    questionId: number,
    dto: UpdatePracticeQuestionDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const q = await prisma.practiceQuestion.findUnique({
      where: { id: questionId },
      include: {
        exerciseSet: { include: { version: { include: { collection: true } } } },
      },
    });
    if (!q) {
      throw AppError.notFound(`Không tìm thấy câu hỏi ID ${questionId}.`);
    }

    if (q.exerciseSet.version) {
      this.ensureVersionEditable(q.exerciseSet.version);
      if (!this.checkOwnership(actor, q.exerciseSet.version)) {
        throw AppError.forbidden('Bạn không thể chỉnh sửa câu hỏi trong bản nháp của người khác.');
      }
    }

    // Validate if prompt or answer or type updated
    const targetType = dto.type || q.type;
    let targetPrompt = dto.prompt;
    if (!targetPrompt) {
      try {
        targetPrompt = JSON.parse(q.prompt);
      } catch {
        targetPrompt = {};
      }
    }

    let targetAnswer = dto.answer;
    if (!targetAnswer) {
      try {
        targetAnswer = JSON.parse(q.answer);
      } catch {
        targetAnswer = {};
      }
    }

    const validation = validatePracticeQuestion(
      targetType,
      targetPrompt || {},
      targetAnswer || {}
    );
    if (!validation.valid) {
      throw AppError.badRequest(validation.error || 'Dữ liệu câu hỏi cập nhật không hợp lệ.');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.practiceQuestion.update({
        where: { id: questionId },
        data: {
          type: dto.type ?? q.type,
          prompt: dto.prompt ? JSON.stringify(dto.prompt) : q.prompt,
          answer: dto.answer ? JSON.stringify(dto.answer) : q.answer,
          explanation:
            dto.explanation !== undefined
              ? dto.explanation
                ? JSON.stringify(dto.explanation)
                : null
              : q.explanation,
          score: dto.score ?? q.score,
          sortOrder: dto.sortOrder ?? q.sortOrder,
          sourcePage: dto.sourcePage !== undefined ? dto.sourcePage : q.sourcePage,
          sourceAudio: dto.sourceAudio !== undefined ? dto.sourceAudio : q.sourceAudio,
        },
      });

      if (q.exerciseSet.versionId) {
        await tx.practiceCollectionVersion.update({
          where: { id: q.exerciseSet.versionId },
          data: { updatedById: actor.userId },
        });
      }

      await this.recordAuditLog(
        tx,
        actor.userId,
        'UPDATE_PRACTICE_QUESTION',
        'PracticeQuestion',
        questionId,
        q,
        updated,
        ipAddress
      );

      return mapQuestionDetail(updated);
    });
  }

  async deleteQuestion(questionId: number, actor: { userId: number; role: string }, ipAddress?: string) {
    const q = await prisma.practiceQuestion.findUnique({
      where: { id: questionId },
      include: {
        exerciseSet: { include: { version: { include: { collection: true } } } },
        _count: { select: { attemptAnswers: true } },
      },
    });
    if (!q) {
      throw AppError.notFound(`Không tìm thấy câu hỏi ID ${questionId}.`);
    }

    if (q.exerciseSet.version) {
      this.ensureVersionEditable(q.exerciseSet.version);
      if (!this.checkOwnership(actor, q.exerciseSet.version)) {
        throw AppError.forbidden('Bạn không thể xóa câu hỏi trong bản nháp của người khác.');
      }
    }

    if (q._count.attemptAnswers > 0) {
      throw AppError.conflict(
        `Không thể xóa câu hỏi vì đã có ${q._count.attemptAnswers} bài làm của học viên tham chiếu.`,
        'QUESTION_HAS_ANSWERS'
      );
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.practiceQuestion.delete({
        where: { id: questionId },
      });

      if (q.exerciseSet.versionId) {
        await tx.practiceCollectionVersion.update({
          where: { id: q.exerciseSet.versionId },
          data: { updatedById: actor.userId },
        });
      }

      await this.recordAuditLog(
        tx,
        actor.userId,
        'DELETE_PRACTICE_QUESTION',
        'PracticeQuestion',
        questionId,
        q,
        null,
        ipAddress
      );

      return { success: true, message: 'Đã xóa câu hỏi thành công.' };
    });
  }

  async duplicateQuestion(
    questionId: number,
    dto: DuplicatePracticeQuestionDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const q = await prisma.practiceQuestion.findUnique({
      where: { id: questionId },
      include: {
        exerciseSet: { include: { version: { include: { collection: true } } } },
      },
    });
    if (!q) {
      throw AppError.notFound(`Không tìm thấy câu hỏi ID ${questionId}.`);
    }

    if (q.exerciseSet.version) {
      this.ensureVersionEditable(q.exerciseSet.version);
      if (!this.checkOwnership(actor, q.exerciseSet.version)) {
        throw AppError.forbidden('Bạn không thể nhân bản câu hỏi trong bản nháp của người khác.');
      }
    }

    const newCode = dto.newCode || `${q.code}-COPY-${Date.now().toString().slice(-4)}`;

    const existingCode = await prisma.practiceQuestion.findUnique({
      where: { code: newCode },
    });
    if (existingCode) {
      throw AppError.conflict(`Mã câu hỏi mới "${newCode}" đã tồn tại.`);
    }

    return prisma.$transaction(async (tx) => {
      const cloned = await tx.practiceQuestion.create({
        data: {
          exerciseSetId: q.exerciseSetId,
          code: newCode,
          type: q.type,
          prompt: q.prompt,
          answer: q.answer,
          explanation: q.explanation,
          score: q.score,
          sortOrder: q.sortOrder + 1,
          status: 'PUBLISHED',
          sourcePage: q.sourcePage,
          sourceAudio: q.sourceAudio,
        },
      });

      if (q.exerciseSet.versionId) {
        await tx.practiceCollectionVersion.update({
          where: { id: q.exerciseSet.versionId },
          data: { updatedById: actor.userId },
        });
      }

      await this.recordAuditLog(
        tx,
        actor.userId,
        'DUPLICATE_PRACTICE_QUESTION',
        'PracticeQuestion',
        cloned.id,
        { sourceQuestionId: questionId },
        cloned,
        ipAddress
      );

      return mapQuestionDetail(cloned);
    });
  }

  async reorderQuestions(
    exerciseSetId: number,
    dto: ReorderPracticeItemsDto,
    actor: { userId: number; role: string },
    ipAddress?: string
  ) {
    const set = await prisma.practiceExerciseSet.findUnique({
      where: { id: exerciseSetId },
      include: {
        version: { include: { collection: true } },
        questions: true,
      },
    });
    if (!set) {
      throw AppError.notFound(`Không tìm thấy phần bài tập ID ${exerciseSetId}.`);
    }

    if (set.version) {
      this.ensureVersionEditable(set.version);
      if (!this.checkOwnership(actor, set.version)) {
        throw AppError.forbidden('Bạn không có quyền sắp xếp trong bản nháp của người khác.');
      }
    }

    const questionIds = new Set(set.questions.map((q) => q.id));
    for (const item of dto.items) {
      if (!questionIds.has(item.id)) {
        throw AppError.badRequest(`Câu hỏi ID ${item.id} không thuộc phần bài tập ID ${exerciseSetId}.`);
      }
    }

    const sortOrders = dto.items.map((i) => i.sortOrder);
    if (new Set(sortOrders).size !== sortOrders.length) {
      throw AppError.badRequest('Giá trị sortOrder không được trùng lặp.');
    }

    return prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        await tx.practiceQuestion.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        });
      }

      if (set.versionId) {
        await tx.practiceCollectionVersion.update({
          where: { id: set.versionId },
          data: { updatedById: actor.userId },
        });
      }

      await this.recordAuditLog(
        tx,
        actor.userId,
        'REORDER_PRACTICE_QUESTIONS',
        'PracticeExerciseSet',
        exerciseSetId,
        null,
        dto.items,
        ipAddress
      );

      return { success: true, message: 'Đã sắp xếp lại thứ tự các câu hỏi thành công.' };
    });
  }
}

export const practiceAdminService = new PracticeAdminService();
