import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import PhoneDialer from "./PhoneDialer";
import Table from "./Table";
import { TrashIcon, PencilIcon, RefreshIcon } from "@heroicons/react/outline";
import CallLogModal from "./CallLogModal";
import ConfirmationDialog from "./ConfirmationDialog";
import Papa from "papaparse";
import { ListManager } from "react-beautiful-dnd-grid";
import { Card, Dropdown } from "flowbite-react";
import CardGrid from './components/card-grid'
//import Image from "next/image";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

const App = () => {

  {/*toggle button to change between table and cards*/ }
  const [toggled, setToggled] = useState(false);

  //const list = [{ id: "0" }, { id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];

  const [token, setToken] = useState(null);
  const [clicked, setClicked] = useState(false);
  const identity = "hamza";
  const [data, setData] = useState([]);
  const [phoneNumberInput, setPhoneNumberInput] = useState("");
  const [editingRow, setEditingRow] = React.useState(null);
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [currentCallLogs, setCurrentCallLogs] = useState([]);
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState("");
  const [isLoadingCallLogs, setIsLoadingCallLogs] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataLoadError, setDataLoadError] = useState(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [callSid, setCallSid] = useState(null);
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [csvUploadProgress, setCsvUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCancelled, setUploadCancelled] = useState(false);
  const [csvUploadError, setCsvUploadError] = useState(null);

  const retryCount = 3;
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  const handleCSVUpload = (file) => {
    setIsUploading(true);
    setCsvUploadProgress(0);
    setUploadCancelled(false);

    Papa.parse(file, {
      header: true,
      step: (row, parser) => {
        if (uploadCancelled) {
          parser.abort();
          return;
        }
        processCSVRow(row.data);
        setCsvUploadProgress(
          (oldProgress) => oldProgress + (1 / file.size) * 100
        );
      },
      complete: () => {
        if (!uploadCancelled) {
          setIsUploading(false);
          fetchData();
        } else {
          console.log("Upload cancelled");
          // Optionally, reset the upload progress or handle as needed
        }
      },
    });
  };
  const processCSVRow = async (row) => {
    if (row.phone && row.name && row.email) {
      if (!data.some((record) => record.phone === row.phone)) {
        await handleAddNewRecord(row);
      }
    } else {
      console.error("Invalid row format:", row);
      setCsvUploadError(`Invalid row format in CSV: ${JSON.stringify(row)}`);
      // Optionally, you can stop the parsing process here if needed.
    }
  };

  const fetchData = useCallback(async () => {
    setIsDataLoading(true);
    setDataLoadError(null);
    try {
      const response = await fetch(`${serverUrl}/api/contacts`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      console.log(result)
    } catch (error) {
      console.error("Fetching data failed", error);
      if (retryCount > 0) {
        setTimeout(() => fetchData(retryCount - 1), 2000);
      } else {
        setDataLoadError("Failed to load data. Please refresh the page.");
      }
    } finally {
      setIsDataLoading(false);
    }
  }, [serverUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNewRecord = useCallback(
    async (newRecord) => {
      try {
        const response = await fetch(`${serverUrl}/api/contacts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newRecord),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const addedRecord = await response.json();
        setData((prevData) => [...prevData, addedRecord]);
      } catch (error) {
        console.error("Error adding new record:", error);
        // Update state to show error message to the user
      }
    },
    [serverUrl]
  );

  const handleRemoveRecord = useCallback(async () => {
    if (recordToDelete) {
      try {
        const response = await fetch(
          `${serverUrl}/api/contacts/${recordToDelete._id}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        setData((currentData) =>
          currentData.filter((item) => item._id !== recordToDelete._id)
        );
        setRecordToDelete(null);
      } catch (error) {
        console.error(
          "There has been a problem with your fetch operation:",
          error
        );
      }
    }
    setShowConfirmationDialog(false);
  }, [recordToDelete, serverUrl]);

  const requestDeleteRecord = useCallback((record) => {
    setRecordToDelete(record);
    setShowConfirmationDialog(true);
  }, []);

  const handleEditRecord = useCallback(
    async (recordId, updatedRecord) => {
      try {
        const response = await fetch(`${serverUrl}/api/contacts/${recordId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedRecord),
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const updatedData = await response.json();
        setData((currentData) =>
          currentData.map((item) =>
            item._id === recordId ? updatedData : item
          )
        );
      } catch (error) {
        console.error(
          "There has been a problem with your fetch operation:",
          error
        );
      }
    },
    [serverUrl]
  );

  const handlePhoneCall = useCallback(
    (phoneNumber) => {
      setPhoneNumberInput(phoneNumber);

      const record = data.find((item) => item.phone === phoneNumber);
      if (record) {
        const updatedRecord = {
          ...record,
          last_contacted: new Date().toISOString(),
        };

        handleEditRecord(record._id, updatedRecord)
          .then(() => fetchData())
          .catch((error) => console.error("Error updating record: ", error));
      }
      setIsDialerOpen(true);
    },
    [data, fetchData, handleEditRecord]
  );

  const handleViewCallLogs = useCallback(
    async (phoneNumber) => {
      if (abortController) {
        abortController.abort();
      }

      const newController = new AbortController();
      setAbortController(newController);
      setShowCallLogModal(true);
      setIsLoadingCallLogs(true);
      setCurrentPhoneNumber(phoneNumber);
      try {
        const response = await fetch(
          `${serverUrl}/call-logs?to=${phoneNumber}`,
          {
            signal: newController.signal,
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const callLogs = await response.json();
        setCurrentCallLogs(callLogs);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Fetching call logs failed", error);
        }
      } finally {
        setIsLoadingCallLogs(false);
      }
    },
    [abortController, serverUrl]
  );

  const handleCloseModal = () => {
    setShowCallLogModal(false);
    setIsLoadingCallLogs(false);
    setCurrentCallLogs([]);
    setCurrentPhoneNumber("");
    if (abortController) {
      abortController.abort();
    }
  };

  //columns to display
  const allColumns = React.useMemo(
    () => [
      {
        Header: "ID",
        accessor: "_id",
      },
      {
        Header: "Phone",
        accessor: "phone",
        Cell: ({ value, row }) => (
          <div className="flex items-center">
            <span>{value}</span>
            <button
              onClick={() => handlePhoneCall(value)}
              className="ml-2 p-1 text-blue-500 hover:text-blue-700"
            >
              <i className="fas fa-phone"></i>
            </button>
          </div>
        ),
      },
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Email",
        accessor: "email",
      },
      {
        Header: "Last Contacted",
        accessor: "last_contacted",
        Cell: ({ value }) => {
          if (value) {
            const dateOnly = value.split('T')[0];
            return <span>{dateOnly}</span>;
          } else
            return <span>{value}</span>;
        },
      },
      {
        Header: "Date Created",
        accessor: "createdAt",
        Cell: ({ value }) => {
          const dateOnly = value.split("T")[0];
          return <span>{dateOnly}</span>;
        },
      },
      {
        Header: "Actions",
        id: "actions",
        isActionColumn: true,
        Cell: ({ row }) => (
          <div className="flex justify-start space-x-2">
            <button
              onClick={() => setEditingRow(row.original)}
              title="Edit Record"
              className="text-green-600 hover:text-green-800"
            >
              <PencilIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => requestDeleteRecord(row.original)}
              title="Delete Record"
              className="text-red-600 hover:text-red-800"
            >
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => handleViewCallLogs(row.original.phone)}
              title="View Call Logs"
              className="text-blue-600 hover:text-blue-800"
            >
              <i className="fas fa-history" aria-hidden="true"></i>
            </button>
          </div>
        ),
      },
    ],
    [setEditingRow, handleViewCallLogs, requestDeleteRecord, handlePhoneCall]
  );

  const tableColumns = allColumns.filter((column) => column.accessor !== "_id");
  const formColumns = allColumns.filter(
    (column) =>
      column.accessor && column.accessor !== "_id" && !column.isActionColumn
  );

  const handleClick = () => {
    setClicked(true);
    fetch(`${serverUrl}/voice/token?identity=${encodeURIComponent(identity)}`)
      .then((response) => response.json())
      .then(({ token }) => setToken(token));
  };

  const handleAddNewNumber = async (newNumber) => {
    const numberExists = data.some(
      (record) => record.phone === newNumber.phone
    );
    if (!numberExists) {
      await handleAddNewRecord({
        ...newNumber,
      });
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <main className="mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex justify-end mb-4">
          {!clicked && (
            <button
              onClick={handleClick}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <i className="fas fa-phone-alt mr-2"></i>
              Connect
            </button>
          )}
          {token && (
            <div className="top-buttons">

              {/*toggle button to change between table and cards*/}
              <div className="toggle-top">
                <span id="mode-title">Modo visualización</span>
                <div className="toggle-section"
                  onClick={() => setToggled(!toggled)}>
                  <span id='mode-table'>Tabla</span>
                  <button className={`toggle-btn ${toggled ? 'toggled' : ''}`}
                  >
                    <div className="thumb" >
                    </div>
                  </button>
                  <span id='mode-card'>Tarjetas</span>
                </div>
              </div>

              <button
                onClick={() => setIsDialerOpen(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center ml-2"
              >
                <i className="fas fa-phone-alt mr-2"></i>
                Open Dialer
              </button>
            </div>
          )}
        </div>
        {token ? (
          <div className="flex flex-wrap -mx-3">
            <div className="w-full lg:w-1/5 px-3 mb-4 lg:mb-0">
              {isDialerOpen && (
                <div className="fixed inset-0 flex flex-col items-end justify-start z-50">
                  <div className="bg-white rounded-lg shadow-md p-4 w-96 relative">
                    <button
                      onClick={() => setIsDialerOpen(false)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-full"
                    >
                      X
                    </button>
                    <PhoneDialer
                      token={token}
                      number={phoneNumberInput}
                      setNumber={setPhoneNumberInput}
                      setCallSid={setCallSid}
                      existingNumbers={data.map((record) => record.phone)}
                      onAddNewNumber={handleAddNewNumber}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="w-full lg:w-4/5 px-3">
              <div className="p-4 bg-white rounded-lg shadow-xs overflow-auto">
                {isDataLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="loader">
                      <RefreshIcon className="h-8 w-8 text-black animate-spin" />
                    </div>
                  </div>
                ) : dataLoadError ? (
                  <div>{dataLoadError}</div>
                ) : !toggled ? (

                  <Table
                    columns={tableColumns}
                    formColumns={formColumns}
                    data={data}
                    onAddNewRecord={handleAddNewRecord}
                    onRemoveRecord={handleRemoveRecord}
                    onEditRecord={handleEditRecord}
                    editingRow={editingRow}
                    setEditingRow={setEditingRow}
                    handleCSVUpload={handleCSVUpload}
                    isUploading={isUploading}
                    csvUploadProgress={csvUploadProgress}
                    setUploadCancelled={setUploadCancelled}
                    csvUploadError={csvUploadError}
                    setCsvUploadError={setCsvUploadError}
                  />
                ) :
                  
                 /*                   <ListManager
                                      items={data}
                                      direction="horizontal"
                                      maxItems={4}
                                      render={item => <Cards customer={item} />}
                                      onDragEnd={reorderList}
                                    />*/
                  
                      <CardGrid list={data} />

                  /*
                   <DragDropContext onDragEnd={(result) => {
                     const { source, destination } = result;
                     if (!destination) return
                     if (source.index === destination.index &&
                       source.droppableId === destination.droppableId)
                       return
 
                     setData(prevData => reorder(prevData, source.index, destination.index ) )  
                   }}>
                     <Droppable droppableId="customers">
                       {(droppableProvided) => (
                         <ul
                           {...droppableProvided.droppableProps}
                           ref={droppableProvided.innerRef} className="card-container"
                         >
                           {data.map((customer, index) => (
 
                             <Draggable key={customer._id}
                               draggableId={customer._id} index={index}
                             >
                               {(draggableProvided) => (
                                 <li {...draggableProvided.draggableProps}
                                   ref={draggableProvided.innerRef}
                                   {...draggableProvided.dragHandleProps}
                                   key={customer._id}>{customer.name}</li>
                               )}
                             </Draggable>
                           ))}
                           {droppableProvided.placeholder}
                         </ul>
                       )}
                     </Droppable>
                   </DragDropContext>
 */
                }
              </div>
            </div>
          </div>
        ) : (
          clicked && <p className="text-center">Loading...</p>
        )}
      </main>
      {showCallLogModal && (
        <CallLogModal
          isLoading={isLoadingCallLogs}
          phoneNumber={currentPhoneNumber}
          callLogs={currentCallLogs}
          onClose={() => handleCloseModal()}
        />
      )}
      <ConfirmationDialog
        isOpen={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
        onConfirm={handleRemoveRecord}
        message="Are you sure you want to delete this record?"
      />
      {csvUploadError && <div className="alert">{csvUploadError}</div>}
    </div>
  );
};

function Cards({ customer }) {
  console.log('props: ', customer.name);
  return (
    <Card className="max-w-sm">
      <div className="flex justify-end px-4 pt-4">
        <Dropdown inline label="">
          <Dropdown.Item>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Edit
            </a>
          </Dropdown.Item>
          <Dropdown.Item>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Export Data
            </a>
          </Dropdown.Item>
          <Dropdown.Item>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Delete
            </a>
          </Dropdown.Item>
        </Dropdown>
      </div>
      <div className="flex flex-col items-center pb-10">
        {/*}
        <Image
          alt="Bonnie image"
          height="96"
          src="/images/people/profile-picture-3.jpg"
          width="96"
          className="mb-3 rounded-full shadow-lg"
        />
  {*/}
        <h5 className="mb-1 text-xl font-medium text-gray-900 dark:text-white">{customer.name}</h5>
        <span className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</span>
        <div className="mt-4 flex space-x-3 lg:mt-6">
          <a
            href="#"
            className="inline-flex items-center rounded-lg bg-cyan-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:bg-cyan-600 dark:hover:bg-cyan-700 dark:focus:ring-cyan-800"
          >
            Llamar
          </a>
          <a
            href="#"
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
          >
            Enviar mensaje
          </a>
        </div>
      </div>
    </Card>
  );
}

//reorder cards
const reorder = (list, startIndex, endIndex) => {
  const result = [...list]
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

const reorderList = (sourceIndex, destinationIndex) => {
  if (destinationIndex === sourceIndex) {
    return;
  }
  const list = this.state.sortedList;
  if (destinationIndex === 0) {
    list[sourceIndex].order = list[0].order - 1;
    this.sortList();
    return;
  }
  if (destinationIndex === list.length - 1) {
    list[sourceIndex].order = list[list.length - 1].order + 1;
    this.sortList();
    return;
  }
  if (destinationIndex < sourceIndex) {
    list[sourceIndex].order = (list[destinationIndex].order + list[destinationIndex - 1].order) / 2;
    this.sortList();
    return;
  }
  list[sourceIndex].order = (list[destinationIndex].order + list[destinationIndex + 1].order) / 2;
  this.sortList();
}

function sortList(list) {
  return list.slice().sort((first, second) => first.order - second.order);
}

const noop = function () { };

//const ListElement = props => <div>id: {props.item._id}</div>;
//const ListElement = props => <Cards customer={props.item}></Cards>;

export default App;
