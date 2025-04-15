import { useContext } from 'react';
import { NavLink } from 'react-router';
import { GlobleContext } from '../context/Context';

const Header = () => {
    const {
        userState: { isLogin, username },
        userDispatch,
        signalRState: { signalRService, privateRoomInitiated },
        signalRDispatch,
    } = useContext(GlobleContext);

    const handleLogout = async () => {
        if (privateRoomInitiated.accepted && privateRoomInitiated.requested) {
            await signalRService?.closePrivateRoom({
                from: username,
                to:
                    privateRoomInitiated.accepted !== username
                        ? privateRoomInitiated.accepted
                        : privateRoomInitiated.requested,
                content: 'UserLogout',
            });
        } else {
            userDispatch({ type: 'LOGOUT', payload: null });
            await signalRService?.removeUserCnnection();
            signalRDispatch({
                type: 'REMOVE_SIGNALR_CONNECTION',
                payload: null,
            });
        }
    };

    return (
        <nav className="bg-gray-900 text-white px-4 py-3 w-full">
            <div className="container mx-auto flex flex-wrap items-center justify-between">
                <NavLink
                    to="/"
                    className="text-lg font-bold text-white hover:text-gray-300"
                >
                    TicTacToe
                </NavLink>
                <button
                    className="md:hidden text-white"
                    onClick={() => {
                        const nav = document.getElementById('mobile-nav');
                        nav.classList.toggle('hidden');
                    }}
                >
                    ☰
                </button>
                <div
                    className="hidden w-full md:flex md:items-center md:w-auto"
                    id="mobile-nav"
                >
                    <ul className="md:flex md:space-x-4 mt-3 md:mt-0">
                        <li>
                            <NavLink
                                to="/view"
                                className="block px-3 py-2 rounded hover:bg-gray-700"
                            >
                                View
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/play"
                                className="block px-3 py-2 rounded hover:bg-gray-700"
                            >
                                Play
                            </NavLink>
                        </li>
                    </ul>
                    <div className="md:ml-auto flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 mt-3 md:mt-0">
                        {isLogin ? (
                            <>
                                <span className="px-3 py-2 bg-gray-800 rounded">
                                    {username}
                                </span>
                                <button
                                    className="px-3 py-2 bg-red-600 rounded hover:bg-red-700"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink
                                    to="/login"
                                    className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700"
                                >
                                    Login
                                </NavLink>
                                <NavLink
                                    to="/register"
                                    className="px-3 py-2 bg-green-600 rounded hover:bg-green-700"
                                >
                                    Register
                                </NavLink>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
