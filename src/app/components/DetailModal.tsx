"use client";

import { useEffect, useId } from "react";

type Props = {
    title: string;
    triggerLabel?: string;
    children: React.ReactNode;

    // ログ
    onOpen?: () => void;
    onClose?: () => void;
};

export default function DetailModal({
    title,
    triggerLabel = "詳細を見る",
    children,
    onOpen,
    onClose,
}: Props) {
    const dialogId = useId();

    // Escで閉じた場合
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <>
            <button
                type="button"
                className="text-sm underline text-gray-700"
                onClick={() => {
                    onOpen?.();
                    const el = document.getElementById(dialogId) as HTMLDialogElement | null;
                    el?.showModal();
                }}
            >
                {triggerLabel}
            </button>

            <dialog
                id={dialogId}
                className="w-full max-w-lg rounded-lg p-0 backdrop:bg-black/30"
                onClose={() => onClose?.()}
            >
                <div className="rounded-lg bg-white">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div className="font-semibold text-gray-900">{title}</div>
                    </div>

                    <div className="px-4 py-4 text-sm text-gray-800">{children}</div>

                    <div className="border-t px-4 py-3 text-right">
                        <button
                            type="button"
                            className="rounded border px-3 py-2 text-sm"
                            onClick={() => {
                                const el = document.getElementById(dialogId) as HTMLDialogElement | null;
                                el?.close();
                                onClose?.();
                            }}
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
}
