import { useCallback, useState } from 'react';
import { BOARD_SIZE, Position, TILE_SIZE } from '../Constants';

interface DragState {
    activePiece: HTMLElement | null;
    grabPosition: Position;
}

export const useDragAndDrop = () => {
    const [dragState, setDragState] = useState<DragState>({
        activePiece: null,
        grabPosition: { x: -1, y: -1 },
    });

    const startDragging = useCallback(
        (element: HTMLElement, position: Position) => {
            // Set initial position for dragging
            element.style.zIndex = '100';
            element.style.position = 'absolute';
            const mouseX = element.getBoundingClientRect().left;
            const mouseY = element.getBoundingClientRect().top;
            element.style.left = `${mouseX}px`;
            element.style.top = `${mouseY}px`;

            setDragState({
                activePiece: element,
                grabPosition: position,
            });
        },
        []
    );

    const stopDragging = useCallback(() => {
        if (dragState.activePiece) {
            // Reset the piece's position to its original position
            dragState.activePiece.style.position = 'relative';
            dragState.activePiece.style.removeProperty('top');
            dragState.activePiece.style.removeProperty('left');
            dragState.activePiece.style.removeProperty('z-index');
        }
        setDragState({
            activePiece: null,
            grabPosition: { x: -1, y: -1 },
        });
    }, [dragState.activePiece]);

    const updateDragPosition = useCallback(
        (
            e: React.MouseEvent | React.Touch,
            chessboardRef: React.RefObject<HTMLDivElement>
        ) => {
            if (!dragState.activePiece || !chessboardRef.current) return;

            const chessboard = chessboardRef.current;
            const minX = chessboard.offsetLeft;
            const minY = chessboard.offsetTop;
            const maxX =
                chessboard.offsetLeft + chessboard.clientWidth - TILE_SIZE;
            const maxY =
                chessboard.offsetTop + chessboard.clientHeight - TILE_SIZE;
            const x = e.clientX - TILE_SIZE / 2;
            const y = e.clientY - TILE_SIZE / 2;

            dragState.activePiece.style.position = 'absolute';
            dragState.activePiece.style.left = `${Math.max(
                minX,
                Math.min(x, maxX)
            )}px`;
            dragState.activePiece.style.top = `${Math.max(
                minY,
                Math.min(y, maxY)
            )}px`;
        },
        [dragState.activePiece]
    );

    const calculateGrabPosition = useCallback(
        (
            e: React.MouseEvent,
            chessboardRef: React.RefObject<HTMLDivElement>
        ) => {
            if (!chessboardRef.current) return { x: -1, y: -1 };

            const chessboard = chessboardRef.current;
            const grabX = Math.floor(
                (e.clientX - chessboard.offsetLeft) / TILE_SIZE
            );
            const grabY = Math.abs(
                Math.ceil(
                    (e.clientY - chessboard.offsetTop - BOARD_SIZE) / TILE_SIZE
                )
            );
            return { x: grabX, y: grabY };
        },
        []
    );

    const calculateDropPosition = useCallback(
        (
            e: React.MouseEvent,
            chessboardRef: React.RefObject<HTMLDivElement>
        ) => {
            if (!chessboardRef.current) return { x: -1, y: -1 };

            const chessboard = chessboardRef.current;
            const x = Math.floor(
                (e.clientX - chessboard.offsetLeft) / TILE_SIZE
            );
            const y = Math.abs(
                Math.ceil(
                    (e.clientY - chessboard.offsetTop - BOARD_SIZE) / TILE_SIZE
                )
            );
            return { x, y };
        },
        []
    );

    return {
        dragState,
        startDragging,
        stopDragging,
        updateDragPosition,
        calculateGrabPosition,
        calculateDropPosition,
    };
};
