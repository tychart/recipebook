import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CookbookShareModal from "../components/CookbookShareModal";

type ThreeDotsMenuProps = {
    userRole: string | null;
    id?: string;
};

export default function ThreeDotsMenu({ userRole, id }: ThreeDotsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [showShare, setShowShare] = useState(false);
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
            {/* Three dots button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors border-none bg-none hover:bg-transparent bg-transparent"
            >
                {/* Vertical ellipsis */}
                <span className="block w-1 h-1 bg-black rounded-full mb-1"></span>
                <span className="block w-1 h-1 bg-black rounded-full mb-1"></span>
                <span className="block w-1 h-1 bg-black rounded-full"></span>
            </button>

            {/* Dropdown */}
            <div
                className={`absolute right-0 mt-2 w-48 bg-white/80 backdrop-blur-sm border border-gray-200/30 rounded-2xl shadow-md z-10 transform transition-all duration-150 ${isOpen
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
            >
                {userRole === "owner" && (
                    <button
                        onClick={() => navigate(`/cookbook/${id}/edit`)}
                        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-gray-100 rounded-b-xl transition border-none"
                    >
                        Edit
                    </button>
                )}

                {userRole === "owner" && (
                    <button
                        onClick={() => setShowShare(true)}
                        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-gray-100 rounded-b-xl transition border-none"
                    >
                        Manage access
                    </button>
                )}

                {userRole === "owner" && (
                    <button
                        onClick={() => navigate(`/cookbooks`)}
                        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-gray-100 rounded-b-xl transition border-none text-red-500"
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

        </div>
    );
}



