export default function Loader({ text = "Loading..." }) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="flex gap-2 mb-4">
                <div className="w-4 h-4 bg-orange-500 border-[3px] border-stone-900 dark:border-stone-700 animate-bounce shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]" style={{ animationDelay: '0ms' }}></div>
                <div className="w-4 h-4 bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 animate-bounce shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]" style={{ animationDelay: '150ms' }}></div>
                <div className="w-4 h-4 bg-emerald-400 border-[3px] border-stone-900 dark:border-stone-700 animate-bounce shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]" style={{ animationDelay: '300ms' }}></div>
            </div>
            <div className="text-stone-900 dark:text-stone-100 font-black uppercase tracking-widest text-sm animate-pulse">
                {text}
            </div>
        </div>
    );
}
