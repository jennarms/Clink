import { useState } from 'react';
import LinkItem from './LinkItem';

export default function LinkList({ links, userId, onDeleteLink, onUpdateLink, onReorderLinks, onFeatureLink }) {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  if (links.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
        No links yet — add your first one above.
      </p>
    );
  }

  const handleDragStart = (id) => {
    setDraggedId(id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault(); // required for onDrop to fire
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    setDragOverId(null);

    if (draggedId === null || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const fromIndex = links.findIndex((l) => l.id === draggedId);
    const toIndex = links.findIndex((l) => l.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    const reordered = [...links];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    setDraggedId(null);
    onReorderLinks(reordered);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <LinkItem
          key={link.id}
          link={link}
          userId={userId}
          onDeleteLink={onDeleteLink}
          onUpdateLink={onUpdateLink}
          onFeatureLink={onFeatureLink}
          isDragging={draggedId === link.id}
          isDragOver={dragOverId === link.id && draggedId !== link.id}
          onDragStart={() => handleDragStart(link.id)}
          onDragOver={(e) => handleDragOver(e, link.id)}
          onDrop={(e) => handleDrop(e, link.id)}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}