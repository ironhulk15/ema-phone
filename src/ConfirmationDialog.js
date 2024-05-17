import React, { useState } from "react";
import { RefreshIcon } from "@heroicons/react/outline";

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, message }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);

    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <p>{message}</p>
        <div className="flex justify-end mt-4">
          {isDeleting ? (
            <div className="flex justify-center items-center h-full">
              <div className="loader">
                <RefreshIcon className="h-8 w-8 text-black animate-spin" />
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
              >
                Confirm
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
