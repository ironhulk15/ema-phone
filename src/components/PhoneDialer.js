'use client'

import React, { useState, useEffect } from "react";
import { Device } from "twilio-client";


const states = {
  CONNECTING: "Conectando",
  READY: "Listo para llamar",
  ON_CALL: "En llamada",
  OFFLINE: "Desconectado",
};

const PhoneDialer = ({ token, setCallSid, existingNumbers, onAddNewNumber }) => {
  const [number, setNumber] = useState(""); // The phone number to call
  const [isCalling, setIsCalling] = useState(false);
  const [state, setState] = useState(states.CONNECTING);
  const [callInfo, setCallInfo] = useState({
    conn: null,
    device: null,
    muted: false,
  });

  const handleNumberChange = (event) => setNumber(event.target.value);
  const handleBackSpace = () => setNumber(number.slice(0, -1));
  const handleNumberPressed = (num) => () => setNumber(number + num);
  const handleMute = () => {
    callInfo.conn.mute(!callInfo.muted);
    setCallInfo({ ...callInfo, muted: !callInfo.muted });
  };
  const handleCall = async () => {
    setIsCalling(true);
    callInfo.device.connect({ To: number });
    /*
    if (!existingNumbers.includes(number)) {
      await onAddNewNumber({ phone: number });
    }
    */
  };

  const handleHangup = () => callInfo.device.disconnectAll();
  const isConnecting = state === states.CONNECTING;

  useEffect(() => {
    const device = new Device();
    device.setup(token, { debug: true });

    device.on("ready", () => {
      setCallInfo((currentCallInfo) => ({ ...currentCallInfo, device }));
      setState(states.READY);
    });

    device.on("connect", (conn) => {
      const callSid = conn.parameters.parentCallSid;
      setCallSid(callSid);
      setState(states.ON_CALL);
      setCallInfo(currentCallInfo => ({ ...currentCallInfo, conn }));
      setIsCalling(false);
    });

    const handleCallFailed = () => {
      setIsCalling(false);
    };

    device.on("disconnect", handleCallFailed);
    device.on("cancel", handleCallFailed);
    device.on("reject", handleCallFailed);

    const updateStateOnEvent = (event, newState, connUpdate = {}) => {
      device.on(event, (conn) => {
        setState(newState);
        setCallInfo(currentCallInfo => ({ ...currentCallInfo, conn, ...connUpdate }));
      });
    };

    ["disconnect", "cancel", "reject"].forEach(event =>
      updateStateOnEvent(event, states.READY, { conn: null })
    );
    return () => {
      device.destroy();
      setState(states.OFFLINE);
      setCallInfo({ conn: null, device: null, muted: false });
    };
  }, [token, setCallSid]);


  function checkNumber(num){
    console.log('num ',num)
    handleNumberPressed(num);
  }

  return (
    <>
      {callInfo.conn && state === states.ON_CALL ? (
        <>
          {/* Call Controls */}
          <div className="flex justify-center mt-10 max-w-xs">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full inline-flex items-center"
              onClick={handleMute}
            >
              <i
                className={`fa fa-fw ${callInfo.muted ? "fa-microphone-slash" : "fa-microphone"
                  }`}
              ></i>


            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full inline-flex items-center ml-4"
              onClick={handleHangup}
            >
              <i className="fas fa-phone-slash"></i>
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Dialer */}
            <div className="container mx-auto my-4 p-4 bg-white rounded-lg shadow-lg max-w-xs">
            <input
              type="tel"
              value={number}
              onChange={handleNumberChange}
              readOnly= 'true'
              className="form-input w-full text-center text-2xl py-2 rounded-md border-2 border-gray-300 focus:border-blue-500 transition duration-200 text-black"
              disabled={isConnecting}
            />
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "+", 0].map((num, index) => (
                <button
                  key={index}
                  className="bg-gray-400 rounded-lg text-xl p-3 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  onClick={handleNumberPressed(num)}
                  disabled={isConnecting}
                >
                  {num}
                </button>
              ))}
              {number.length > 0 && (
                <button
                  className="bg-red-500 text-white rounded-lg text-xl p-3 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 transition duration-200"
                  onClick={handleBackSpace}
                >
                  {"<--"}
                </button>
              )}
            </div>
            <div className="flex justify-center mt-5">

                {state == states.READY &&
              <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
                
                onClick={handleCall}
                disabled={isConnecting || isCalling}
              >
                    {isCalling ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-phone"></i>}
              </button>
                }
            </div>
          </div>
        </>
      )}
      <p className="text-center bg-gray-300 py-2 px-4 rounded-md mx-auto my-5 w-48 text-black" >
        {state}
      </p>
    </>
  );
};

export default PhoneDialer;
