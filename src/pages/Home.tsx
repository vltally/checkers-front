import React from 'react';
import Chessboard from '../components/Chessboard/Chessboard';

const Home: React.FC = () => {
    return (
        <div className="chessboard-container">
            <div className="w-full sm:w-[40vw] md:w-[35vw] lg:w-[30vw] h-auto max-w-full max-h-[70vh] flex justify-center items-center">
                <Chessboard />
            </div>
        </div>
    );
};

export default Home;
