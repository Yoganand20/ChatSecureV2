import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export default function SimpleConfirmationModal({
    isOpen,
    onClose,
    title,
    message,
    primaryButtonText,
    secondaryButtonText,
    onPrimaryClick,
    onSecondaryClick,
}) {
    const handlePrimaryClick = () => {
        if (onPrimaryClick) {
            onPrimaryClick();
        }
        onClose();
    };

    const handleSecondaryClick = () => {
        if (onSecondaryClick) {
            onSecondaryClick();
        }
        onClose();
    };

    return (
        <Dialog
            open={isOpen}
            as="div"
            className="relative z-10 focus:outline-none"
            onClose={onClose}>
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto bg-black/25">
                <div className="flex min-h-full items-center justify-center p-4">
                    <DialogPanel
                        transition
                        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0">
                        <DialogTitle
                            as="h3"
                            className="text-lg font-semibold text-gray-900 mb-4">
                            {title}
                        </DialogTitle>

                        <p className="text-sm text-gray-600 mb-6">{message}</p>

                        <div className="flex gap-3 justify-end">
                            <Button
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                onClick={handleSecondaryClick}>
                                {secondaryButtonText}
                            </Button>

                            <Button
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={handlePrimaryClick}>
                                {primaryButtonText}
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
