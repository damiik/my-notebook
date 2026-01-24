'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { IArticleData } from '@/models/Article';
import AuthContext from './AuthContext';
import axios from 'axios';

// --- Types ---
interface ArticleState {
  articles: IArticleData[];
  currentArticle: IArticleData | null;
  storedArticles: string[]; // IDs of stored articles
  viewMode: boolean; // true = View, false = Edit
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_ARTICLES'; payload: IArticleData[] }
  | { type: 'SET_CURRENT_ARTICLE'; payload: IArticleData | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'TOGGLE_VIEW_MODE' }
  | { type: 'SET_VIEW_MODE'; payload: boolean }
  | { type: 'ADD_STORED'; payload: string }
  | { type: 'REMOVE_STORED'; payload: string }
  | { type: 'UPDATE_ARTICLE_LOCAL'; payload: IArticleData }
  | { type: 'INIT_APPLICATION'; payload: IArticleData[] };

// --- Initial State ---
const initialState: ArticleState = {
  articles: [],
  currentArticle: null,
  storedArticles: [],
  viewMode: true,
  loading: false,
  error: null,
};

// --- Reducer ---
const articleReducer = (state: ArticleState, action: Action): ArticleState => {
  switch (action.type) {
    case 'INIT_APPLICATION': {
      const allArticles = action.payload;
      const main = allArticles.find(a => a.summary === '#main');
      
      // Handle #unassigned logic
      const unassigned = allArticles.find(a => a.summary === '#unassigned');
      if (unassigned) {
        unassigned.childs = allArticles
          .filter(article => {
            const hasParent = allArticles.some(parent => 
              parent.childs.some(child => child.id === article._id)
            );
            return !hasParent && article.summary !== '#main' && article.summary !== '#unassigned';
          })
          .map(article => ({ type: 'LINK', id: article._id! }));
      }

      return {
        ...state,
        articles: allArticles,
        currentArticle: state.currentArticle 
          ? (allArticles.find(a => a._id === state.currentArticle?._id) || main || allArticles[0] || null)
          : (main || allArticles[0] || null),
        loading: false,
        error: null
      };
    }
    case 'SET_ARTICLES':
      return { ...state, articles: action.payload, loading: false };
    case 'SET_CURRENT_ARTICLE':
      return { ...state, currentArticle: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'TOGGLE_VIEW_MODE':
      return { ...state, viewMode: !state.viewMode };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'ADD_STORED':
      if (state.storedArticles.includes(action.payload)) return state;
      return { ...state, storedArticles: [action.payload, ...state.storedArticles] };
    case 'REMOVE_STORED':
      return { ...state, storedArticles: state.storedArticles.filter(id => id !== action.payload) };
    case 'UPDATE_ARTICLE_LOCAL':
      return {
        ...state,
        articles: state.articles.map(art => art._id === action.payload._id ? action.payload : art),
        currentArticle: state.currentArticle?._id === action.payload._id ? action.payload : state.currentArticle
      };
    default:
      return state;
  }
};

// --- Context ---
interface ArticleContextType extends ArticleState {
  fetchArticles: () => Promise<void>;
  selectArticle: (id: string) => void;
  toggleViewMode: () => void;
  setViewMode: (mode: boolean) => void;
  addToStored: (id: string) => void;
  removeFromStored: (id: string) => void;
  updateArticle: (article: IArticleData) => Promise<void>;
  createArticle: () => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(articleReducer, initialState);
  const { isAuthenticated } = useContext(AuthContext);

  const fetchArticles = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await axios.get('/api/articles');
      dispatch({ type: 'INIT_APPLICATION', payload: res.data });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.response?.data?.error || 'Failed to fetch articles' });
    }
  };

  const selectArticle = (id: string) => {
    const article = state.articles.find(a => a._id === id);
    if (article) dispatch({ type: 'SET_CURRENT_ARTICLE', payload: article });
  };

  const updateArticle = async (article: IArticleData) => {
    if (!article || !article._id) return;
    dispatch({ type: 'UPDATE_ARTICLE_LOCAL', payload: article });
    try {
      await axios.put(`/api/articles/${article._id}`, article);
    } catch (err: any) {
      console.error("Failed to save article:", err.response?.data || err.message);
      dispatch({ type: 'SET_ERROR', payload: err.response?.data?.details || 'Failed to save article to database' });
    }
  }

  const createArticle = async () => {
    const parent = state.currentArticle;
    const newArt = {
      title: "New Article",
      description: "<p>Edit me...</p>",
      summary: "",
      childs: []
    };
    try {
      const res = await axios.post('/api/articles', newArt);
      const savedArt = res.data;
      
      // 1. Add new article to local list
      dispatch({ type: 'SET_ARTICLES', payload: [...state.articles, savedArt] });

      // 2. If we have a parent, link the new article to it
      if (parent) {
        const updatedParent = {
          ...parent,
          childs: [...parent.childs, { id: savedArt._id, type: 'LINK' as const }]
        };
        // Save parent update to DB
        await axios.put(`/api/articles/${parent._id}`, updatedParent);
        // Update parent in local state
        dispatch({ type: 'UPDATE_ARTICLE_LOCAL', payload: updatedParent });
      }

      // 3. Switch to the new article in edit mode
      dispatch({ type: 'SET_CURRENT_ARTICLE', payload: savedArt });
      dispatch({ type: 'SET_VIEW_MODE', payload: false });
    } catch (err: any) {
      console.error("Failed to create article", err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create and link new article' });
    }
  };

  const deleteArticle = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    try {
      await axios.delete(`/api/articles/${id}`);
      const newArticles = state.articles.filter(a => a._id !== id);
      dispatch({ type: 'SET_ARTICLES', payload: newArticles });
      if (state.currentArticle?._id === id) {
        dispatch({ type: 'SET_CURRENT_ARTICLE', payload: newArticles[0] || null });
      }
      alert("Article deleted.");
    } catch (err: any) {
      console.error("Failed to delete article", err);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [isAuthenticated]);

  return (
    <ArticleContext.Provider value={{
      ...state,
      fetchArticles,
      selectArticle,
      toggleViewMode: () => dispatch({ type: 'TOGGLE_VIEW_MODE' }),
      setViewMode: (mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
      addToStored: (id) => dispatch({ type: 'ADD_STORED', payload: id }),
      removeFromStored: (id) => dispatch({ type: 'REMOVE_STORED', payload: id }),
      updateArticle,
      createArticle,
      deleteArticle
    }}>
      {children}
    </ArticleContext.Provider>
  );
};

export const useArticle = () => {
  const context = useContext(ArticleContext);
  if (!context) throw new Error('useArticle must be used within ArticleProvider');
  return context;
};
