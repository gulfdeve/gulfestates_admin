"use client";
import React, { useState, useEffect } from "react";
import TeamSlider from "./TeamSlider";
import CreateEditSliderModal from "./CreateEditSliderModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { toast } from "sonner";

interface SliderItem {
  image: string;
  name: string;
  index: number;
}

const TeamSliderSection: React.FC = () => {
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showSliderModal, setShowSliderModal] = useState(false);
  const [editingSliderItem, setEditingSliderItem] = useState<SliderItem | null>(
    null
  );
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchSliderItems();
  }, []);

  const fetchSliderItems = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/team?locale=en`);

      const data = await response.json();

      if (data.success && data.data) {
        setSliderItems(data.data.teamslider || []);
      } else if (response.status !== 404) {
        toast.error(data.message || "Failed to load slider items");
      }
    } catch (err: any) {
      console.error("Error fetching slider items:", err);
      toast.error("Error loading slider items");
    } finally {
      setLoading(false);
    }
  };

  const saveSliderItems = async (items: SliderItem[]) => {
    try {
      setSaving(true);

      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        setSaving(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/team`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamslider: items,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Slider items saved successfully");
        setSliderItems(items);
      } else {
        toast.error(data.message || "Failed to save slider items");
      }
    } catch (err: any) {
      console.error("Error saving slider items:", err);
      toast.error("Error saving slider items");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSliderItem = (itemData: {
    image: string;
    name: string;
    index: number;
  }) => {
    const newItems = [...sliderItems, itemData].sort(
      (a, b) => a.index - b.index
    );
    saveSliderItems(newItems);
    setShowSliderModal(false);
  };

  const handleUpdateSliderItem = (itemData: {
    image: string;
    name: string;
    index: number;
  }) => {
    if (!editingSliderItem) return;

    const itemIndex = sliderItems.findIndex(
      (item) =>
        item.image === editingSliderItem.image &&
        item.name === editingSliderItem.name &&
        item.index === editingSliderItem.index
    );

    if (itemIndex === -1) return;

    const updatedItems = [...sliderItems];
    updatedItems[itemIndex] = itemData;
    const sortedItems = updatedItems.sort((a, b) => a.index - b.index);

    saveSliderItems(sortedItems);
    setShowSliderModal(false);
    setEditingSliderItem(null);
  };

  const handleDeleteSliderItem = (index: number) => {
    setDeleteConfirmIndex(index);
  };

  const confirmDeleteSliderItem = () => {
    if (deleteConfirmIndex === null) return;
    const updatedItems = sliderItems.filter((_, idx) => idx !== deleteConfirmIndex);
    saveSliderItems(updatedItems);
    setDeleteConfirmIndex(null);
  };

  const handleEditSliderItem = (index: number) => {
    const item = sliderItems[index];
    if (item) {
      setEditingSliderItem(item);
      setShowSliderModal(true);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <LoadingSpinner inline size="sm" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <TeamSlider
        items={sliderItems}
        onAdd={() => {
          setEditingSliderItem(null);
          setShowSliderModal(true);
        }}
        onEdit={handleEditSliderItem}
        onDelete={handleDeleteSliderItem}
      />

      <CreateEditSliderModal
        isOpen={showSliderModal}
        onClose={() => {
          setShowSliderModal(false);
          setEditingSliderItem(null);
        }}
        onSubmit={
          editingSliderItem ? handleUpdateSliderItem : handleAddSliderItem
        }
        mode={editingSliderItem ? "edit" : "create"}
        initialData={editingSliderItem}
        maxIndex={
          sliderItems.length > 0
            ? Math.max(...sliderItems.map((i) => i.index))
            : 0
        }
      />

      <DeleteConfirmModal
        isOpen={deleteConfirmIndex !== null}
        title="Delete Slider Item"
        message="Are you sure you want to delete this slider item? This action cannot be undone."
        onConfirm={confirmDeleteSliderItem}
        onCancel={() => setDeleteConfirmIndex(null)}
      />
    </div>
  );
};

export default TeamSliderSection;
