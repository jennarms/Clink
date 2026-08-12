export default function LinkList({ links, onDeleteLink }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-700 mb-3 text-sm">
        Your Links ({links.length})
      </h3>

      {links.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No links added yet!</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-3.5 bg-[#F9F8F3] border border-slate-200 rounded-xl group hover:border-[#2D5A27]/50 transition-colors"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate mr-2 flex-1"
              >
                <div className="font-semibold text-[#2D5A27] text-sm group-hover:underline truncate">
                  {link.title}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">{link.url}</div>
              </a>
              <button
                onClick={() => onDeleteLink(link.id)}
                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="Delete link"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}