'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { IArticleData } from '@/models/Article';
import { ITopicData } from '@/models/Topic';
import AuthContext from './AuthContext';
import axios from 'axios';

// --- Types ---
interface ArticleState {
  articles: IArticleData[];
  topics: ITopicData[];
  currentArticle: IArticleData | null;
  currentTopicId: string | null;
  storedArticles: string[]; // IDs of stored articles
  viewMode: boolean; // true = View, false = Edit
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_ARTICLES'; payload: IArticleData[]}
  | { type: 'SELECT_TOPIC'; id: string }
  | { type: 'SET_CURRENT_ARTICLE'; payload: IArticleData | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'TOGGLE_VIEW_MODE' }
  | { type: 'SET_VIEW_MODE'; payload: boolean }
  | { type: 'ADD_STORED'; payload: string }
  | { type: 'REMOVE_STORED'; payload: string }
  | { type: 'UPDATE_ARTICLE_LOCAL'; payload: IArticleData }
  | { type: 'INIT_APPLICATION'; payload: IArticleData[];  topics: ITopicData[]  };

// --- Initial State ---
const initialState: ArticleState = {
  articles: [],
  topics: [],
  currentArticle: null,
  currentTopicId: null,
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
        topics: action.topics,
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
    case 'SELECT_TOPIC':
      return { ...state, currentTopicId: action.id };      
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
  // Computed values
  currentArticle: IArticleData | null;
  currentTopic: ITopicData | null;
  // currentTopicArticles: IArticleData[];

  fetchArticles: () => Promise<void>;
  selectArticle: (id: string) => void;
  toggleViewMode: () => void;
  setViewMode: (mode: boolean) => void;
  addToStored: (id: string) => void;
  removeFromStored: (id: string) => void;
  updateArticle: (article: IArticleData) => Promise<void>;
  createArticle: () => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  addTagToArticle: (articleId: string, tagId: string) => Promise<void>;
  removeTagFromArticle: (articleId: string, tagId: string) => Promise<void>;
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(articleReducer, initialState);
  const { isAuthenticated } = useContext(AuthContext);

  const fetchArticles = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await axios.get('/api/articles');
      const topicsRes = await axios.get('/api/topics');
      dispatch({ type: 'INIT_APPLICATION', payload: res.data, topics: topicsRes.data });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.response?.data?.error || 'Failed to fetch articles' });
    }
  };

  const selectArticle = async (id: string) => {
    const article = state.articles.find(a => a._id === id);
    if (article) {
      dispatch({ type: 'SET_CURRENT_ARTICLE', payload: article });
      
      // ⭐ NOWA LOGIKA: Wejście do #unassigned = adopcja osieroconych artykułów
      if (article.summary === '#unassigned') {
        const orphans = state.articles.filter(a => 
          a._id !== article._id && 
          (!a.tags || a.tags.length === 0) &&
          !a.summary?.includes('#main') &&  // Nie przenoś maina
          !a.summary?.includes('#unassigned') // Nie przenoś samego siebie
        );
        
        // Dodaj każdemu osieroconemu tag #unassigned
        for (const orphan of orphans) {
          if (!orphan.tags?.includes(article._id.toString())) {
            const updated = {
              ...orphan,
              tags: [...(orphan.tags || []), article._id.toString()]
            };
            await updateArticle(updated);
          }
        }
        
        if (orphans.length > 0) {
          console.log(`Assigned ${orphans.length} orphaned articles to #unassigned`);
        }
      }
    }
  };

  const removeTagFromArticle = async (articleId: string, tagId: string) => {
    const article = state.articles.find(a => a._id === articleId);
    if (!article) return;
    
    let newTags = article.tags.filter(t => t !== tagId);
    
    // ⭐ FALLBACK: Jeśli usunęliśmy ostatni tag, dodaj #unassigned
    if (newTags.length === 0) {
      const unassigned = state.articles.find(a => a.summary === '#unassigned');
      // Upewnij się że nie dodajemy samego do siebie i że artykuł #unassigned istnieje
      if (unassigned && unassigned._id.toString() !== articleId) {
        newTags.push(unassigned._id.toString());
        console.log(`Article ${article.title} became orphaned, auto-assigned to #unassigned`);
      }
    }
    
    const updatedArticle = {
      ...article,
      tags: newTags,
    };
    
    await updateArticle(updatedArticle);
  };

  const currentTopic = state.topics.find(t => t._id === state.currentTopicId) || null;
  
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
    
    // Przygotuj nowy artykuł z tagiem wskazującym na rodzica
    const newArt = {
      title: "New Article",
      description: "<p>Edit me...</p>",
      summary: "",
      tags: parent ? [parent._id.toString()] : [], // ⭐ KLUCZOWA ZMIANA: tag zamiast childs
      childs: [] // Zachowujemy dla PARTów lub wstecznej kompatybilności
    };
    
    try {
      const res = await axios.post('/api/articles', newArt);
      const savedArt = res.data;
      
      // 1. Dodaj do lokalnej listy artykułów
      dispatch({ type: 'SET_ARTICLES', payload: [...state.articles, savedArt] });

      // 2. ⭐ USUNIĘTE: Nie aktualizujemy już childs rodzica
      // Relacja jest teraz przechowywana w tags dziecka (savedArt)
      
      // 3. Przełącz na nowy artykuł w trybie edycji
      dispatch({ type: 'SET_CURRENT_ARTICLE', payload: savedArt });
      dispatch({ type: 'SET_VIEW_MODE', payload: false });
      
    } catch (err: any) {
      console.error("Failed to create article", err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create new article' });
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

  const addTagToArticle = async (articleId: string, tagId: string) => {
    const article = state.articles.find(a => a._id === articleId);
    if (!article) return;
    
    const updatedArticle = {
      ...article,
      tags: [...new Set([...article.tags, tagId])], // Prevent duplicates
    };
    
    await updateArticle(updatedArticle);
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
      deleteArticle,
      currentTopic,
      addTagToArticle,
      removeTagFromArticle,
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
