import React from 'react';
import { Button } from '../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';

interface GameOverModalProps {
    open: boolean;
    winner: string | null;
    message: string;
    onRestart: () => void;
    onClose: () => void;
    onLeaveRoom?: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
    open,
    winner,
    message,
    onRestart,
    onClose,
    onLeaveRoom
}) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Game Over</DialogTitle>
                    <DialogDescription>
                        {message}
                        {winner && <p>Winner: {winner}</p>}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="default" onClick={onRestart}>
                        Restart Game
                    </Button>
                    <Button
                        onClick={onLeaveRoom}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Leave Room
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default GameOverModal;
