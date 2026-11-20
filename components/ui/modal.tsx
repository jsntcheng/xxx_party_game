"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
  /** 不可通过遮罩/ESC/关闭按钮关闭（如必须完成的任务）。 */
  persistent?: boolean
  /** 标题仅供读屏使用，不显示。 */
  hideTitle?: boolean
}

/** 统一弹窗：Radix Dialog（焦点管理、ESC、读屏）+ 进出场动画。 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  persistent,
  hideTitle,
}: ModalProps) {
  const block = persistent ? (event: Event) => event.preventDefault() : undefined
  return (
    <Dialog.Root open={open} onOpenChange={persistent ? undefined : onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          onEscapeKeyDown={block}
          onPointerDownOutside={block}
          onInteractOutside={block}
          className={cn(
            "glass-strong fixed top-1/2 left-1/2 z-50 flex max-h-[min(88dvh,760px)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl shadow-2xl shadow-black/50 outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className,
          )}
        >
          <div className={cn("flex items-start gap-3 px-5 pt-5", hideTitle && "sr-only")}>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-lg font-semibold text-white">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-white/55">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            {!persistent && (
              <Dialog.Close
                className="-mt-1 -mr-1 rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="关闭"
              >
                <X className="size-5" />
              </Dialog.Close>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-white/8 px-5 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
