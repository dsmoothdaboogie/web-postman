import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Collection, Request, Environment, HistoryEntry } from '../database';
import { CollectionService, RequestService } from '../services/collectionService';
import type { Tab } from '../types';
import { db } from '../database';

interface AppContextType {
  collections: Collection[];
  requests: Request[];
  environments: Environment[];
  history: HistoryEntry[];
  activeEnvironment: Environment | null;
  tabs: Tab[];
  activeTabId: string | null;
  initialRequestData: Partial<Request> | null;
  
  // Collection actions
  createCollection: (name: string, description?: string, parentId?: string) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  
  // Request actions
  createRequest: (name: string, method: string, url: string, collectionId?: string) => Promise<void>;
  updateRequest: (id: string, updates: Partial<Request>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  
  // Tab actions
  createTab: (requestId?: string, initialData?: Partial<Request>) => void;
  closeTab: (tabId: string) => void;
  selectTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  clearInitialRequestData: () => void;
  
  // Environment actions
  createEnvironment: (name: string, variables: Record<string, string>) => Promise<void>;
  updateEnvironment: (id: string, updates: Partial<Environment>) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironment: (id: string) => Promise<void>;
  
  // History actions
  addToHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeEnvironment, setActiveEnvironmentState] = useState<Environment | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [initialRequestData, setInitialRequestData] = useState<Partial<Request> | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [collectionsData, environmentsData, historyData] = await Promise.all([
        CollectionService.getCollections(),
        db.environments.toArray(),
        db.history.orderBy('timestamp').reverse().toArray()
      ]);
      
      setCollections(collectionsData);
      setEnvironments(environmentsData);
      setHistory(historyData);
      
      // Set active environment
      const activeEnv = environmentsData.find((env: Environment) => env.isActive);
      if (activeEnv) {
        setActiveEnvironmentState(activeEnv);
      }
      
      // Create initial tab if none exist
      if (tabs.length === 0) {
        createTab();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const createCollection = async (name: string, description?: string, parentId?: string) => {
    try {
      const collection = await CollectionService.createCollection(name, description, parentId);
      setCollections(prev => [...prev, collection]);
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    try {
      await CollectionService.updateCollection(id, updates);
      setCollections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (error) {
      console.error('Failed to update collection:', error);
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      await CollectionService.deleteCollection(id);
      setCollections(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const createRequest = async (name: string, method: string, url: string, collectionId?: string) => {
    try {
      const request = await RequestService.createRequest(name, method, url, collectionId);
      setRequests(prev => [...prev, request]);
    } catch (error) {
      console.error('Failed to create request:', error);
    }
  };

  const updateRequest = async (id: string, updates: Partial<Request>) => {
    try {
      await RequestService.updateRequest(id, updates);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (error) {
      console.error('Failed to update request:', error);
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      await RequestService.deleteRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete request:', error);
    }
  };

  const createTab = (requestId?: string, initialData?: Partial<Request>) => {
    const newTab: Tab = {
      id: Date.now().toString(),
      name: requestId ? 'Request' : (initialData?.name || 'New Request'),
      type: 'request',
      requestId,
      isActive: false,
      isDirty: false
    };
    
    setTabs(prev => {
      const updatedTabs = prev.map(tab => ({ ...tab, isActive: false }));
      return [...updatedTabs, newTab];
    });
    setActiveTabId(newTab.id);
    
    // Store initial data for the RequestBuilder to use
    if (initialData) {
      setInitialRequestData(initialData);
    } else {
      setInitialRequestData(null);
    }
  };

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[remainingTabs.length - 1].id);
      }
    }
  };

  const selectTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => ({ ...tab, isActive: tab.id === tabId })));
    setActiveTabId(tabId);
  };

  const updateTab = (tabId: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(tab => tab.id === tabId ? { ...tab, ...updates } : tab));
  };

  const clearInitialRequestData = () => {
    setInitialRequestData(null);
  };

  const createEnvironment = async (name: string, variables: Record<string, string>) => {
    try {
      const environment: Environment = {
        id: Date.now().toString(),
        name,
        variables,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.environments.add(environment);
      setEnvironments(prev => [...prev, environment]);
    } catch (error) {
      console.error('Failed to create environment:', error);
    }
  };

  const updateEnvironment = async (id: string, updates: Partial<Environment>) => {
    try {
      await db.environments.update(id, { ...updates, updatedAt: new Date() });
      setEnvironments(prev => prev.map(env => env.id === id ? { ...env, ...updates } : env));
    } catch (error) {
      console.error('Failed to update environment:', error);
    }
  };

  const deleteEnvironment = async (id: string) => {
    try {
      await db.environments.delete(id);
      setEnvironments(prev => prev.filter(env => env.id !== id));
    } catch (error) {
      console.error('Failed to delete environment:', error);
    }
  };

  const setActiveEnvironment = async (id: string) => {
    try {
      // Deactivate all environments
      await db.environments.toCollection().modify({ isActive: false });
      
      // Activate selected environment
      await db.environments.update(id, { isActive: true });
      
      const environment = environments.find(env => env.id === id);
      if (environment) {
        setActiveEnvironmentState({ ...environment, isActive: true });
      }
    } catch (error) {
      console.error('Failed to set active environment:', error);
    }
  };

  const addToHistory = async (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    try {
      const historyEntry: HistoryEntry = {
        ...entry,
        id: Date.now().toString(),
        timestamp: new Date()
      };
      
      await db.history.add(historyEntry);
      setHistory(prev => [historyEntry, ...prev]);
    } catch (error) {
      console.error('Failed to add to history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await db.history.clear();
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const value: AppContextType = {
    collections,
    requests,
    environments,
    history,
    activeEnvironment,
    tabs,
    activeTabId,
    initialRequestData,
    createCollection,
    updateCollection,
    deleteCollection,
    createRequest,
    updateRequest,
    deleteRequest,
    createTab,
    closeTab,
    selectTab,
    updateTab,
    clearInitialRequestData,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    addToHistory,
    clearHistory
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
