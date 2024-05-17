import React, { useEffect, useState, useCallback } from "react";
import PhoneDialer from "../../components/PhoneDialer";

const Dial = () => {

    const [token, setToken] = useState(null);
    const [callSid, setCallSid] = useState(null);
    const [phoneNumberInput, setPhoneNumberInput] = useState("");
    const identity = "hamza";
    const serverUrl = process.env.REACT_APP_SERVER_URL;


    fetch(`${serverUrl}/voice/token?identity=${encodeURIComponent(identity)}`)
        .then((response) => response.json())
        .then(({ token }) => setToken(token));


    return (
        <>{token ? ( // if token exists, render PhoneDialer component   
            <PhoneDialer
                token={token}
                //number={phoneNumberInput}
                //setNumber={setPhoneNumberInput}
                setCallSid={setCallSid}
            //existingNumbers={data.map((record) => record.phone)}
            //onAddNewNumber={handleAddNewNumber}
            />
        ) : ( // if token doesn't exist, render a loading message
            <p className="text-center">Cargando...</p>
        )}
        </>
    );
};


export default Dial;