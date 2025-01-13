import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';
import { Card, CardHeader, CardTitle, CardContent } from './UI/Card';
import { Button } from './UI/Button';

interface GameRoom {
    id: string;
    player1Id: string;
}

const GameRooms = () => {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [rooms, setRooms] = useState<GameRoom[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Створюємо підключення до SignalR
        const newConnection = new HubConnectionBuilder()
            .withUrl("http://localhost:5115/gameHub")
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        // Підключаємось до хабу
        const startConnection = async () => {
            try {
                await newConnection.start();
                console.log("Connected to SignalR");
                
                // Отримуємо список кімнат після підключення
                await newConnection.invoke("GetAvailableGames");
            } catch (err) {
                console.log("Error connecting to SignalR:", err);
            }
        };

        startConnection();

        return () => {
            newConnection.stop();
        };
    }, []);

    useEffect(() => {
        if (connection) {
            // Підписуємось на оновлення списку кімнат
            connection.on("AvailableGames", (gameRooms: GameRoom[]) => {
                setRooms(gameRooms);
            });

            // Підписуємось на подію створення гри
            connection.on("GameCreated", (gameId: string) => {
                navigate(`/game/${gameId}`);
            });

            // Підписуємось на успішне приєднання до гри
            connection.on("PlayerJoined", () => {
                // Тут можна додати якусь логіку перед переходом
                const gameId = rooms.find(room => room.player1Id === connection.connectionId)?.id;
                if (gameId) {
                    navigate(`/game/${gameId}`);
                }
            });
        }
    }, [connection, navigate, rooms]);

    const createRoom = async () => {
        try {
            if (connection) {
                await connection.invoke("CreateGame");
            }
        } catch (err) {
            console.error("Error creating game:", err);
        }
    };

    const joinRoom = async (gameId: string) => {
        try {
            if (connection) {
                await connection.invoke("JoinGame", gameId);
                navigate(`/game/${gameId}`);
            }
        } catch (err) {
            console.error("Error joining game:", err);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Available Game Rooms</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Button 
                            onClick={createRoom}
                            className="w-full bg-green-500 hover:bg-green-600"
                        >
                            Create New Room
                        </Button>
                    </div>
                    
                    <div className="grid gap-4">
                        {rooms.length > 0 ? (
                            rooms.map((room) => (
                                <Card key={room.id} className="p-4">
                                    <div className="flex justify-between items-center">
                                        <span>Room ID: {room.id.slice(0, 8)}...</span>
                                        <Button 
                                            onClick={() => joinRoom(room.id)}
                                            className="bg-blue-500 hover:bg-blue-600"
                                        >
                                            Join Game
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center text-gray-500">
                                No available rooms. Create one!
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GameRooms;