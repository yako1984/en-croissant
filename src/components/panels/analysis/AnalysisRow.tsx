import { previewBoardOnHoverAtom } from "@/atoms/atoms";
import type { Score } from "@/bindings";
import { Chessground } from "@/chessground/Chessground";
import MoveCell from "@/components/boards/MoveCell";
import { TreeDispatchContext } from "@/components/common/TreeStateContext";
import { positionFromFen } from "@/utils/chessops";
import { ActionIcon, Box, Flex, HoverCard, Table } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import type { Key } from "chessground/types";
import { chessgroundMove } from "chessops/compat";
import { makeFen } from "chessops/fen";
import { parseSan } from "chessops/san";
import { useAtomValue } from "jotai";
import { useContext, useState } from "react";
import React from "react";
import ScoreBubble from "./ScoreBubble";

function AnalysisRow({
  score,
  moves,
  halfMoves,
  threat,
  fen,
  orientation,
}: {
  score: Score;
  moves: string[];
  halfMoves: number;
  threat: boolean;
  fen: string;
  orientation: "white" | "black";
}) {
  const [open, setOpen] = useState<boolean>(false);

  if (!open) {
    moves = moves.slice(0, 12);
  }
  const [pos] = positionFromFen(fen);
  const moveInfo = [];
  if (pos) {
    for (const san of moves) {
      const move = parseSan(pos, san);
      if (!move) break;
      pos.play(move);
      const fen = makeFen(pos.toSetup());
      const lastMove = chessgroundMove(move);
      const isCheck = pos.isCheck();
      moveInfo.push({ fen, san, lastMove, isCheck });
    }
  }

  return (
    <Table.Tr style={{ verticalAlign: "top" }}>
      <Table.Td width={70}>
        <ScoreBubble size="md" score={score} />
      </Table.Td>
      <Table.Td>
        <Flex
          direction="row"
          wrap="wrap"
          style={{
            height: open ? "100%" : 35,
            overflow: "hidden",
            alignItems: "center",
          }}
        >
          {moveInfo.map(({ san, fen, lastMove, isCheck }, index) => (
            <BoardPopover
              key={index}
              san={san}
              index={index}
              moves={moves}
              halfMoves={halfMoves}
              threat={threat}
              fen={fen}
              orientation={orientation}
              lastMove={lastMove}
              isCheck={isCheck}
            />
          ))}
        </Flex>
      </Table.Td>
      <Table.Th w={10}>
        <ActionIcon
          style={{
            transition: "transform 200ms ease",
            transform: open ? "rotate(180deg)" : "none",
          }}
          onClick={() => setOpen(!open)}
        >
          <IconChevronDown size={16} />
        </ActionIcon>
      </Table.Th>
    </Table.Tr>
  );
}

function BoardPopover({
  san,
  lastMove,
  isCheck,
  index,
  moves,
  halfMoves,
  threat,
  fen,
  orientation,
}: {
  san: string;
  lastMove: Key[];
  isCheck: boolean;
  index: number;
  moves: string[];
  halfMoves: number;
  threat: boolean;
  fen: string;
  orientation: "white" | "black";
}) {
  const [opened, { close, open }] = useDisclosure(false);
  const total_moves = halfMoves + index + 1 + (threat ? 1 : 0);
  const is_white = total_moves % 2 === 1;
  const move_number = Math.ceil(total_moves / 2);
  const dispatch = useContext(TreeDispatchContext);
  const preview = useAtomValue(previewBoardOnHoverAtom);

  return (
    <HoverCard
      width={230}
      styles={{
        dropdown: {
          padding: 0,
          backgroundColor: "transparent",
          border: "none",
        },
      }}
      openDelay={0}
      closeDelay={50}
    >
      <HoverCard.Target>
        <Box>
          {(index === 0 || is_white) &&
            `${move_number.toString()}${is_white ? "." : "..."}`}
          <MoveCell
            move={san}
            isCurrentVariation={false}
            annotations={[]}
            onContextMenu={() => undefined}
            isStart={false}
            onClick={() => {
              if (!threat) {
                dispatch({
                  type: "MAKE_MOVES",
                  payload: moves.slice(0, index + 1),
                });
              }
            }}
          />
        </Box>
      </HoverCard.Target>
      {preview && (
        <HoverCard.Dropdown
          style={{ pointerEvents: "none", transitionDuration: "0ms" }}
        >
          <Chessground
            fen={fen}
            coordinates={false}
            viewOnly
            orientation={orientation}
            lastMove={lastMove}
            turnColor={is_white ? "black" : "white"}
            check={isCheck}
            drawable={{
              enabled: true,
              visible: true,
              defaultSnapToValidMove: true,
              eraseOnClick: true,
            }}
          />
        </HoverCard.Dropdown>
      )}
    </HoverCard>
  );
}

export default AnalysisRow;
