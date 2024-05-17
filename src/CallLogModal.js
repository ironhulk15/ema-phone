import React, { useState, useEffect } from "react";
import { RefreshIcon } from "@heroicons/react/outline";

const CallLogModal = ({ phoneNumber, callLogs, onClose, isLoading }) => {
  const [copiedId, setCopiedId] = useState("");
  const [callRecordings, setCallRecordings] = useState({});
  const [loadingRecordings, setLoadingRecordings] = useState({});
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  useEffect(() => {
    const fetchRecordings = () => {
      callLogs.forEach((log) => {
        setLoadingRecordings((prevState) => ({
          ...prevState,
          [log.parentCallSid]: true,
        }));

        fetch(`${serverUrl}/call-recordings?callId=${log.parentCallSid}`)
          .then((response) =>
            response.ok ? response.json() : Promise.reject(response)
          )
          .then((recordings) => {
            setCallRecordings((prevState) => ({
              ...prevState,
              [log.parentCallSid]: recordings,
            }));
          })
          .catch((error) => console.error("Error fetching recordings:", error))
          .finally(() => {
            setLoadingRecordings((prevState) => ({
              ...prevState,
              [log.parentCallSid]: false,
            }));
          });
      });
    };

    if (callLogs.length > 0) {
      fetchRecordings();
    }
  }, [callLogs,serverUrl]);

  const copyToClipboard = async (id) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
  };

  const handleDownload = (recordingSid) => {
    const anchor = document.createElement("a");
    anchor.href = `${serverUrl}/download-recording/${recordingSid}`;
    anchor.setAttribute("download", true);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => {
        setCopiedId("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  return (
    <div className="fixed inset-0 z-50 bg-gray-800 bg-opacity-75 overflow-y-auto h-full w-full transition-opacity duration-300 ease-in-out">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:max-w-2xl rounded-lg bg-white shadow-lg">
        <div className="flex justify-between items-center text-lg border-b pb-3">
          <h4 className="text-lg font-semibold text-gray-700">
            Call Logs for {phoneNumber}
          </h4>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-600 transition-colors duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="loader">
                <RefreshIcon className="h-8 w-8 text-black animate-spin" />
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-500 mb-2">
                Total Call Logs: {callLogs.length}
              </p>
              <ul className="max-h-96 overflow-y-auto space-y-2">
                {callLogs.map((log, index) => (
                  <li key={index} className="bg-gray-100 p-4 rounded-md shadow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold">ID:</span>
                        {copiedId === log.parentCallSid ? (
                          <span className="text-green-500 flex items-center">
                            <svg
                              className="w-4 h-4 mr-2"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 11.293a1 1 0 111.586 1.414l-2 2a1 1 0 01-1.414-1.414l2-2zm0 0a1 1 0 011.586-1.414l2 2a1 1 0 11-1.414 1.414l-2-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            copied
                          </span>
                        ) : (
                          <button
                            onClick={() => copyToClipboard(log.parentCallSid)}
                            className="text-green-500 hover:underline ml-2"
                          >
                            click to copy
                          </button>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold">To:</span> {log.to}
                      </div>
                      <div>
                        <span className="font-semibold">Status:</span>{" "}
                        {log.status}
                      </div>
                      <div>
                        <span className="font-semibold">Date:</span>{" "}
                        {new Date(log.dateCreated).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-semibold">Start Time:</span>{" "}
                        {new Date(log.startTime).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-semibold">End Time:</span>{" "}
                        {new Date(log.endTime).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-semibold">Duration:</span>{" "}
                        {log.duration} seconds
                      </div>
                      <div>
                        <span className="font-semibold">Recording:</span>
                        {loadingRecordings[log.parentCallSid] ? (
                          <RefreshIcon className="h-5 w-5 animate-spin" />
                        ) : callRecordings[log.parentCallSid] &&
                          callRecordings[log.parentCallSid].length > 0 ? (
                          callRecordings[log.parentCallSid].map(
                            (recording, idx) => (
                              <div key={idx}>
                                <button
                                  onClick={() => handleDownload(recording.sid)}
                                  className="text-blue-500"
                                >
                                  Download
                                </button>
                              </div>
                            )
                          )
                        ) : (
                          <div className="text-red-500">Not Available</div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallLogModal;
