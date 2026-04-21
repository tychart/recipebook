import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ellipsis } from "lucide-react";
import CookbookShareModal from "../components/CookbookShareModal";
import CookBookDeleteModal from "../components/CookBookDeleteModal";

type ThreeDotsMenuProps = {
    userRole: string | null;
    id?: string;
};

export default function ThreeDotsMenu({ userRole, id }: ThreeDotsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [showShare, setShowShare] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                className="app-button app-button-ghost size-11 rounded-full p-0"
            >
                <Ellipsis className="size-5" aria-hidden />
            </button>

            <div
                className={`absolute right-0 z-30 mt-2 w-48 transform rounded-2xl border border-[var(--border-muted)] bg-[var(--surface)] shadow-[var(--shadow-card)] backdrop-blur-sm transition-all duration-150 ${isOpen
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
            >
                {userRole === "owner" && (
                    <button
                        onClick={() => navigate(`/cookbook/${id}/edit`)}
                        className="flex w-full items-center gap-2 rounded-t-2xl px-4 py-3 text-left text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                    >
                        Edit
                    </button>
                )}

                {userRole === "owner" && (
                    <button
                        onClick={() => setShowShare(true)}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                    >
                        Manage access
                    </button>
                )}

                {userRole === "owner" && (
                    <button
                        onClick={() => setShowDelete(true)}
                        className="flex w-full items-center gap-2 rounded-b-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-[var(--surface-soft)] dark:text-rose-200"
                    >
                        Delete
                    </button>
                )}

            </div>

            {showShare && id && (
                <CookbookShareModal
                    cookbookId={id}
                    onClose={() => setShowShare(false)}
                />
            )}

            {showDelete && id && (
                <CookBookDeleteModal
                    cookbookId={id}
                    onClose={() => setShowDelete(false)}
                />
            )}

        </div>
    );
}

