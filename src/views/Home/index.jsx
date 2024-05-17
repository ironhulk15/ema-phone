import { Link } from "react-router-dom";


const Home = () => {

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-200">

            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">

                <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center lg:static lg:h-auto lg:w-auto lg:bg-none">
                    <a
                        className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
                        href="https://emaautos.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Una solución de{" "}
                        <img
                            src="/logo.png"
                            alt="Ema phone"
                            width={100}
                            height={24}
                            priority
                        />
                    </a>
                </div>
            </div>

            <div className="relative flex place-items-center">
                <h1 className={`mb-3 text-3xl font-semibold`}>EMA phone</h1>
            </div>

            <div className="mb-32 grid text-center">


                <button
                    className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded">
                    <Link to={'/dial'}>Llamar <i className="fas fa-phone"></i></Link>
                </button>

            </div>


        </main>
    );

}

export default Home;