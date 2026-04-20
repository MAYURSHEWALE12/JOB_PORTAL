export default function Loader({ text = "Loading..." }) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-2 border-[var(--color-border)] border-t-[var(--color-terracotta)] rounded-full animate-spin"></div>
            <div className="text-[var(--color-text-muted)] font-medium text-sm mt-4">
                {text}
            </div>
        </div>
    );
}
