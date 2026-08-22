import LinkItem from './LinkItem';

export default function LinkList({ links, onDeleteLink, onUpdateLink }) {
  if (links.length === 0) {
    return (
      <p className="text-xs text-slate-400 text-center py-6">
        No links yet — add your first one above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <LinkItem
          key={link.id}
          link={link}
          onDeleteLink={onDeleteLink}
          onUpdateLink={onUpdateLink}
        />
      ))}
    </div>
  );
}