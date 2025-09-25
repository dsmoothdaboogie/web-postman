import { db } from '../database';
import type { Collection, Request } from '../database';
import { v4 as uuidv4 } from 'uuid';

export class CollectionService {
  static async createCollection(name: string, description?: string, parentId?: string): Promise<Collection> {
    const collection: Collection = {
      id: uuidv4(),
      name,
      description,
      parentId,
      order: await this.getNextOrder(parentId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collections.add(collection);
    return collection;
  }

  static async updateCollection(id: string, updates: Partial<Collection>): Promise<void> {
    await db.collections.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  static async deleteCollection(id: string): Promise<void> {
    // Delete all requests in this collection
    await db.requests.where('collectionId').equals(id).delete();
    
    // Delete all sub-collections
    const subCollections = await db.collections.where('parentId').equals(id).toArray();
    for (const subCollection of subCollections) {
      await this.deleteCollection(subCollection.id);
    }
    
    // Delete the collection itself
    await db.collections.delete(id);
  }

  static async getCollections(): Promise<Collection[]> {
    return await db.collections.orderBy('order').toArray();
  }

  static async getCollection(id: string): Promise<Collection | undefined> {
    return await db.collections.get(id);
  }

  static async getCollectionsByParent(parentId?: string): Promise<Collection[]> {
    return await db.collections
      .where('parentId')
      .equals(parentId || '')
      .toArray();
  }

  static async reorderCollections(collectionIds: string[]): Promise<void> {
    const updates = collectionIds.map((id, index) => ({
      id,
      order: index
    }));
    
    await db.transaction('rw', db.collections, async () => {
      for (const update of updates) {
        await db.collections.update(update.id, { order: update.order });
      }
    });
  }

  private static async getNextOrder(parentId?: string): Promise<number> {
    const collections = await db.collections
      .where('parentId')
      .equals(parentId || '')
      .toArray();
    
    return collections.length;
  }
}

export class RequestService {
  static async createRequest(
    name: string,
    method: string,
    url: string,
    collectionId?: string,
    folderId?: string
  ): Promise<Request> {
    const request: Request = {
      id: uuidv4(),
      name,
      method: method as any,
      url,
      headers: {},
      params: {},
      bodyType: 'raw',
      collectionId,
      folderId,
      order: await this.getNextOrder(collectionId, folderId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.requests.add(request);
    return request;
  }

  static async updateRequest(id: string, updates: Partial<Request>): Promise<void> {
    await db.requests.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  static async deleteRequest(id: string): Promise<void> {
    await db.requests.delete(id);
  }

  static async getRequestsByCollection(collectionId: string): Promise<Request[]> {
    return await db.requests
      .where('collectionId')
      .equals(collectionId)
      .toArray();
  }

  static async getRequestsByFolder(folderId: string): Promise<Request[]> {
    return await db.requests
      .where('folderId')
      .equals(folderId)
      .toArray();
  }

  static async reorderRequests(requestIds: string[]): Promise<void> {
    const updates = requestIds.map((id, index) => ({
      id,
      order: index
    }));
    
    await db.transaction('rw', db.requests, async () => {
      for (const update of updates) {
        await db.requests.update(update.id, { order: update.order });
      }
    });
  }

  private static async getNextOrder(collectionId?: string, folderId?: string): Promise<number> {
    const requests = await db.requests
      .where(collectionId ? 'collectionId' : 'folderId')
      .equals(collectionId || folderId || '')
      .toArray();
    
    return requests.length;
  }
}
