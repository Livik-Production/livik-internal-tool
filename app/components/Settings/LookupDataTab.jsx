'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  SquarePen,
  Search,
  ChevronRight,
  Check,
  X,
  FolderOpen,
  Tag,
  GripVertical,
  AlertCircle,
  Layers,
  ListFilter,
} from 'lucide-react';
import CustomAlertForm from '../CustomAlertForm';
import Loader from '../Loader';

// ─── Reusable inline-edit input ──────────────────────────────────────────────
const InlineEditInput = ({
  value,
  onSave,
  onCancel,
  placeholder = '',
  autoFocus = true,
}) => {
  const [text, setText] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (text.trim()) onSave(text.trim());
    }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 px-2.5 py-1.5 border border-blue-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
      />
      <button
        onClick={() => text.trim() && onSave(text.trim())}
        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        title="Save"
      >
        <Check size={14} strokeWidth={3} />
      </button>
      <button
        onClick={onCancel}
        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
        title="Cancel"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LookupDataTab() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [valueSearchTerm, setValueSearchTerm] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Add new value
  const [isAddingValue, setIsAddingValue] = useState(false);
  const [newValueText, setNewValueText] = useState('');
  const newValueInputRef = useRef(null);

  // Edit value
  const [editingValueId, setEditingValueId] = useState(null);

  // Add new category
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Edit category name
  const [isEditingCategoryName, setIsEditingCategoryName] = useState(false);

  // Delete confirmations
  const [deleteValueTarget, setDeleteValueTarget] = useState(null);
  const [showDeleteValueConfirm, setShowDeleteValueConfirm] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] =
    useState(false);

  // Fetch all dropdown values from DB and group them on mount
  const fetchDropdowns = async () => {
    try {
      const res = await fetch('/api/dropdowns');
      const data = await res.json();
      if (data.data) {
        const groupedData = data.data;
        const allTypes = Object.keys(groupedData);

        const loadedCategories = allTypes.map((type) => {
          const name = type
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          const dbValues = groupedData[type] || [];
          return {
            id: type,
            name: name,
            description: 'Lookup category',
            icon: '📋',
            values: dbValues.map((val) => ({
              id: val.id,
              label: val.label,
              value: val.value,
              isActive: val.status !== 'inactive',
            })),
          };
        });

        setCategories(loadedCategories);
        if (loadedCategories.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(loadedCategories[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
      showToast('Failed to load lookup data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Derived
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredValues = (selectedCategory?.values || []).filter((v) =>
    v.label.toLowerCase().includes(valueSearchTerm.toLowerCase())
  );

  const activeCount = (selectedCategory?.values || []).filter(
    (v) => v.isActive
  ).length;
  const totalCount = (selectedCategory?.values || []).length;

  // ── Focus new value input ──
  useEffect(() => {
    if (isAddingValue && newValueInputRef.current) {
      newValueInputRef.current.focus();
    }
  }, [isAddingValue]);

  // ── Handlers ──

  const handleAddValue = async () => {
    if (!newValueText.trim() || !selectedCategoryId) return;

    // Check for duplicate
    const exists = selectedCategory?.values.some(
      (v) => v.label.toLowerCase() === newValueText.trim().toLowerCase()
    );
    if (exists) {
      showToast('This value already exists in this category.', 'error');
      setNewValueText('');
      return;
    }

    try {
      const res = await fetch('/api/dropdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedCategoryId,
          label: newValueText.trim(),
          value: newValueText.trim(),
          status: 'active',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save value');

      const newValue = {
        id: data.data.id,
        label: data.data.label,
        value: data.data.value,
        isActive: data.data.status !== 'inactive',
      };

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategoryId
            ? { ...cat, values: [...cat.values, newValue] }
            : cat
        )
      );
      showToast('Value added successfully.');
    } catch (error) {
      showToast(error.message, 'error');
    }

    setNewValueText('');
  };

  const handleEditValueSave = async (valueId, newLabel) => {
    try {
      const res = await fetch(`/api/dropdowns/${valueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedCategoryId,
          label: newLabel,
          value: newLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update value');

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategoryId
            ? {
                ...cat,
                values: cat.values.map((v) =>
                  v.id === valueId ? { ...v, label: newLabel } : v
                ),
              }
            : cat
        )
      );
      showToast('Value updated successfully.');
    } catch (error) {
      showToast(error.message, 'error');
    }
    setEditingValueId(null);
  };

  const handleToggleValueActive = async (valueId) => {
    const cat = categories.find((c) => c.id === selectedCategoryId);
    const val = cat?.values.find((v) => v.id === valueId);
    if (!val) return;

    const newActiveState = !val.isActive;
    const newStatus = newActiveState ? 'active' : 'inactive';

    try {
      const res = await fetch(`/api/dropdowns/${valueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedCategoryId,
          label: val.label,
          value: val.value,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');

      setCategories((prev) =>
        prev.map((c) =>
          c.id === selectedCategoryId
            ? {
                ...c,
                values: c.values.map((v) =>
                  v.id === valueId ? { ...v, isActive: newActiveState } : v
                ),
              }
            : c
        )
      );
      showToast(`Value marked as ${newStatus}.`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDeleteValue = (valueId) => {
    setDeleteValueTarget(valueId);
    setShowDeleteValueConfirm(true);
  };

  const confirmDeleteValue = async () => {
    if (!deleteValueTarget) return;
    try {
      const res = await fetch(`/api/dropdowns/${deleteValueTarget}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete value');

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategoryId
            ? {
                ...cat,
                values: cat.values.filter((v) => v.id !== deleteValueTarget),
              }
            : cat
        )
      );
      showToast('Value deleted successfully.');
    } catch (error) {
      showToast(error.message, 'error');
    }
    setShowDeleteValueConfirm(false);
    setDeleteValueTarget(null);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const categoryId = newCategoryName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
    const newCat = {
      id: categoryId,
      name: newCategoryName.trim(),
      description: newCategoryDesc.trim() || 'Custom dropdown category',
      icon: '📋',
      values: [],
    };

    setCategories((prev) => [...prev, newCat]);
    setSelectedCategoryId(newCat.id);
    setNewCategoryName('');
    setNewCategoryDesc('');
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (catId) => {
    setDeleteCategoryTarget(catId);
    setShowDeleteCategoryConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;

    try {
      const res = await fetch(`/api/dropdowns?type=${deleteCategoryTarget}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || 'Failed to delete category values');

      setCategories((prev) =>
        prev.filter((c) => c.id !== deleteCategoryTarget)
      );

      // Select first remaining category
      if (selectedCategoryId === deleteCategoryTarget) {
        const remaining = categories.filter(
          (c) => c.id !== deleteCategoryTarget
        );
        setSelectedCategoryId(remaining[0]?.id || '');
      }
      showToast('Category values deleted successfully.');
    } catch (error) {
      showToast(error.message, 'error');
    }

    setShowDeleteCategoryConfirm(false);
    setDeleteCategoryTarget(null);
  };

  const handleRenameCategory = async (catId, newName) => {
    const formattedNewName = newName.trim();
    if (!formattedNewName) return;

    if (
      formattedNewName.toLowerCase() === selectedCategory?.name.toLowerCase()
    ) {
      setIsEditingCategoryName(false);
      return;
    }

    const newCategoryId = formattedNewName.toLowerCase().replace(/\s+/g, '_');

    // Check if newCategoryId already exists in categories
    const exists = categories.some((c) => c.id === newCategoryId);
    if (exists) {
      showToast('A category with this name already exists.', 'error');
      return;
    }

    const hasValues = selectedCategory?.values.length > 0;

    if (hasValues) {
      try {
        const res = await fetch('/api/dropdowns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldType: catId,
            newType: newCategoryId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to rename category');

        showToast('Category renamed successfully.');
      } catch (error) {
        showToast(error.message, 'error');
        return;
      }
    } else {
      showToast('Category renamed successfully.');
    }

    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, id: newCategoryId, name: formattedNewName } : c
      )
    );
    setSelectedCategoryId(newCategoryId);
    setIsEditingCategoryName(false);
  };

  const handleNewValueKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddValue();
    }
    if (e.key === 'Escape') {
      setIsAddingValue(false);
      setNewValueText('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <Loader label="Loading lookup data..." size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-0 animate-in fade-in duration-300 h-full">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'
          }`}
        >
          {toast.message}
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
        {/* ── Top bar ── */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#e7f0fa] text-[#004475] rounded-xl">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Lookup Data Management
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
              {categories.length} Categories
            </span>
          </div>
        </div>

        {/* ── Body: Sidebar + Content ── */}
        <div className="flex flex-1 min-h-0">
          {/* ── Left Sidebar: Categories ── */}
          <div className="w-72 border-r border-slate-100 flex flex-col bg-slate-50/50 flex-shrink-0">
            {/* Category search */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Category list */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-0.5">
              {filteredCategories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setValueSearchTerm('');
                      setIsAddingValue(false);
                      setEditingValueId(null);
                      setIsEditingCategoryName(false);
                    }}
                    className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#004475] text-white shadow-sm shadow-blue-200'
                        : 'hover:bg-white hover:shadow-sm text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-700'}`}
                      >
                        {cat.name}
                      </div>
                      <div
                        className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}
                      >
                        {cat.values.length} value
                        {cat.values.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className={`flex-shrink-0 transition-all ${
                        isSelected
                          ? 'text-blue-200 opacity-100'
                          : 'text-gray-300 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">No categories found</p>
                </div>
              )}
            </div>

            {/* Add category button */}
            <div className="p-3 border-t border-slate-100">
              {isAddingCategory ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                      if (e.key === 'Escape') {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                        setNewCategoryDesc('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Short description (optional)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                      if (e.key === 'Escape') {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                        setNewCategoryDesc('');
                      }
                    }}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                      className="flex-1 px-3 py-1.5 bg-[#004475] text-white text-xs font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-[#003a66]"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                        setNewCategoryDesc('');
                      }}
                      className="px-3 py-1.5 text-gray-500 text-xs font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-[#004475] bg-[#e7f0fa] hover:bg-blue-100 rounded-xl transition-all border border-blue-100"
                >
                  <Plus size={16} />
                  <span>Add Category</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Right Panel: Values ── */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {selectedCategory ? (
              <>
                {/* Category header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedCategory.icon}</span>
                    <div>
                      {isEditingCategoryName ? (
                        <InlineEditInput
                          value={selectedCategory.name}
                          onSave={(newName) =>
                            handleRenameCategory(selectedCategory.id, newName)
                          }
                          onCancel={() => setIsEditingCategoryName(false)}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-800">
                            {selectedCategory.name}
                          </h3>
                          <button
                            onClick={() => setIsEditingCategoryName(true)}
                            className="p-1 text-gray-400 hover:text-[#004475] hover:bg-slate-50 rounded-lg transition-colors"
                            title="Rename Category"
                          >
                            <SquarePen size={14} />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedCategory.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">
                      {activeCount}/{totalCount} Active
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(selectedCategory.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Search + Add bar */}
                <div className="px-6 py-3 border-b border-slate-50 flex items-center gap-3 flex-shrink-0 bg-slate-50/30">
                  <div className="relative flex-1 max-w-sm">
                    <ListFilter
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={valueSearchTerm}
                      onChange={(e) => setValueSearchTerm(e.target.value)}
                      placeholder="Filter values..."
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>
                  {!isAddingValue ? (
                    <button
                      onClick={() => setIsAddingValue(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#004475] text-white text-sm font-bold rounded-lg hover:bg-[#003a66] transition-all shadow-sm"
                    >
                      <Plus size={15} />
                      <span>Add Value</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={newValueInputRef}
                        type="text"
                        value={newValueText}
                        onChange={(e) => setNewValueText(e.target.value)}
                        onKeyDown={handleNewValueKeyDown}
                        placeholder="Type value & press Enter"
                        className="px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none w-56 transition-all"
                      />
                      <button
                        onClick={handleAddValue}
                        disabled={!newValueText.trim()}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Add"
                      >
                        <Check size={16} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingValue(false);
                          setNewValueText('');
                        }}
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Close"
                      >
                        <X size={16} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Values list */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-3">
                  {filteredValues.length > 0 ? (
                    <div className="space-y-1.5">
                      {filteredValues.map((val, index) => (
                        <div
                          key={val.id}
                          className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                            val.isActive
                              ? 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                              : 'bg-gray-50/50 border-gray-100/50 opacity-60'
                          }`}
                        >
                          {/* Index */}
                          <span className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-lg text-[11px] font-bold text-slate-400 border border-slate-100 flex-shrink-0">
                            {index + 1}
                          </span>

                          {/* Grip handle */}
                          <GripVertical
                            size={14}
                            className="text-gray-200 flex-shrink-0 cursor-grab"
                          />

                          {/* Label or inline edit */}
                          <div className="flex-1 min-w-0">
                            {editingValueId === val.id ? (
                              <InlineEditInput
                                value={val.label}
                                onSave={(newLabel) =>
                                  handleEditValueSave(val.id, newLabel)
                                }
                                onCancel={() => setEditingValueId(null)}
                              />
                            ) : (
                              <span
                                className={`text-sm font-medium ${
                                  val.isActive
                                    ? 'text-slate-700'
                                    : 'text-slate-400 line-through'
                                }`}
                              >
                                {val.label}
                              </span>
                            )}
                          </div>

                          {/* Status pill */}
                          <button
                            onClick={() => handleToggleValueActive(val.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex-shrink-0 border ${
                              val.isActive
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                            }`}
                            title={
                              val.isActive
                                ? 'Click to deactivate'
                                : 'Click to activate'
                            }
                          >
                            {val.isActive ? 'Active' : 'Inactive'}
                          </button>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => setEditingValueId(val.id)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <SquarePen size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteValue(val.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      {valueSearchTerm ? (
                        <>
                          <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <Search size={28} className="text-gray-300" />
                          </div>
                          <p className="text-sm font-semibold text-gray-500">
                            No matching values
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Try a different search term
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="p-4 bg-blue-50 rounded-full mb-4">
                            <Tag size={28} className="text-[#004475]" />
                          </div>
                          <p className="text-sm font-semibold text-gray-600">
                            No values yet
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Click &quot;Add Value&quot; to create dropdown
                            options for this category
                          </p>
                          <button
                            onClick={() => setIsAddingValue(true)}
                            className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-[#004475] text-white text-sm font-bold rounded-lg hover:bg-[#003a66] transition-all"
                          >
                            <Plus size={15} />
                            Add First Value
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom info bar */}
                {filteredValues.length > 0 && (
                  <div className="px-6 py-2.5 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {filteredValues.length} value
                        {filteredValues.length !== 1 ? 's' : ''} shown
                        {valueSearchTerm && ` (filtered)`}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-300 italic">
                      Double-click a value to edit • Toggle status to
                      enable/disable
                    </span>
                  </div>
                )}
              </>
            ) : (
              /* No category selected state */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="p-5 bg-slate-50 rounded-full mb-5">
                  <FolderOpen size={36} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-600 mb-1">
                  Select a Category
                </h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Choose a category from the sidebar to view and manage its
                  dropdown values
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete Value Confirmation ── */}
      <CustomAlertForm
        isOpen={showDeleteValueConfirm}
        onClose={() => {
          setShowDeleteValueConfirm(false);
          setDeleteValueTarget(null);
        }}
        onConfirm={confirmDeleteValue}
        title="Delete Value"
        message="Are you sure you want to remove this dropdown value? This may affect existing records that use it."
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        details={
          deleteValueTarget && (
            <div className="text-sm">
              <p className="font-bold">
                {selectedCategory?.values.find(
                  (v) => v.id === deleteValueTarget
                )?.label || 'Unknown'}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                from {selectedCategory?.name}
              </p>
            </div>
          )
        }
      />

      {/* ── Delete Category Confirmation ── */}
      <CustomAlertForm
        isOpen={showDeleteCategoryConfirm}
        onClose={() => {
          setShowDeleteCategoryConfirm(false);
          setDeleteCategoryTarget(null);
        }}
        onConfirm={confirmDeleteCategory}
        title="Delete Category"
        message="Are you sure you want to delete this entire category? All associated dropdown values will be permanently removed."
        type="danger"
        confirmText="Delete Category"
        cancelText="Cancel"
        details={
          deleteCategoryTarget && (
            <div className="text-sm">
              <p className="font-bold">
                {categories.find((c) => c.id === deleteCategoryTarget)?.name ||
                  'Unknown'}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {categories.find((c) => c.id === deleteCategoryTarget)?.values
                  .length || 0}{' '}
                values will be deleted
              </p>
            </div>
          )
        }
      />
    </div>
  );
}
