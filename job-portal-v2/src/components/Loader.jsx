export default function Loader({ text = "Loading..." }) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-2 border-[#EAD9C4] border-t-[#C2651A] rounded-full animate-spin"></div>
            <div className="text-[#8B7355] font-medium text-sm mt-4">
                {text}
            </div>
        </div>
    );
}
