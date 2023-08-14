import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { DrawSudoku, SudokuState, getOccurence, computeError, getBoardFrom } from './DrawSudoku';
import { Container, TextField } from '@mui/material';
import { Form, useLoaderData } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, SocketData } from "./socketInterface";
import { emit } from 'process';

export async function loader(p: { params: { keyId: string } }) {
  const gameKeyId = p.params.keyId;
  return { gameKeyId };
}

interface DisplayOptions {
  advMode: boolean, autoClear: boolean, autoFill: boolean, warn: boolean, affected: boolean, affectedSameNumber: boolean
}

function TempDrawer(option: DisplayOptions, setOptions: (option: DisplayOptions) => void) {
  const [state, setState] = React.useState(false);

  const toggleDrawer =
    (open: boolean) =>
      (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
          event.type === 'keydown' &&
          ((event as React.KeyboardEvent).key === 'Tab' ||
            (event as React.KeyboardEvent).key === 'Shift')
        ) {
          return;
        }

        setState(open);
      };
  const olist = [option.advMode, option.autoClear, option.autoFill, option.warn, option.affected, option.affectedSameNumber]
  const text = ['Advanved Mode', 'Auto clear candidates', 'Fill only candidate', 'Warn if wrong', 'Highlight cells', "  ... for all same numbers"]
  const qvq = ['advMode', 'autoClear', 'autoFill', 'warn', 'affected', 'affectedSameNumber']
  const enabled = [true, true, true, true, false, !option.affected]
  const gameKeyId = (useLoaderData() as { gameKeyId: string }).gameKeyId;
  const list = () => (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(true)}
      onKeyDown={toggleDrawer(true)}
    >
      <List>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ListItem key={text[i]} disablePadding>
            <ListItemButton disabled={enabled[i]} selected={olist[i]} onClick={(e) => {
              setOptions({ ...option, [qvq[i]]: !olist[i] })
            }}>
              <ListItemText primary={text[i]} />
            </ListItemButton>
          </ListItem>
        ))}
        <Divider />
        <ListItem key={"key"} disablePadding>
          <ListItemButton disabled={true}>
            <ListItemText primary={"Room ID: " + gameKeyId} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <div >
        <Button onClick={toggleDrawer(true)}>Settings</Button>
        <Drawer
          anchor='right'
          open={state}
          onClose={toggleDrawer(false)}
        >
          {list()}
        </Drawer>
      </div ></>
  );
}


function Sudoku(Options: { advMode: boolean, affected: boolean, affectedSameNumber: boolean }) {
  const [Clue, setClue] = React.useState<string>("");
  const [Selection, setSelection] = React.useState<number[]>([]);
  const [SideNumber, setSideNumber] = React.useState<number[]>(Array(9).fill(0));
  const [NotesOn, setNotesOn] = React.useState(false)
  // const [HistoryStack, setHistoryStack] = React.useState<{ Stack: SudokuState[], Top: number } | undefined>(undefined);
  const [State, setState] = React.useState<SudokuState | undefined>(undefined);
  // const State = React.useMemo(() => {HistoryStack?.Stack[HistoryStack?.Top] || null}, [HistoryStack])
  // const State = HistoryStack?.Stack[HistoryStack?.Top] || nullls
  const gameKeyId = (useLoaderData() as { gameKeyId: string }).gameKeyId;
  const [newGamePending, setNewGamePending] = React.useState(false)
  const [pendingStatus, setPendingStatus] = React.useState<number[]>([0, 0])



  const setStateCombined = (State: SudokuState) => {
    setState(State)
    socket.emit("state", State)
  }
  const setSideNumberCombined = (sidenumber: number[]) => {
    setSideNumber(sidenumber)
    socket.emit("sidenumber", sidenumber)
  }
  const setSelectionCombined = (selection: number[]) => {
    setSelection(selection)
    socket.emit("selection", selection)
  }
  const setNewGamePendingCombined = (pd: boolean) => {
    setNewGamePending(pd)
    socket.emit("newgame", pd)
  }
  const SetSideNumberTo = (i: number, v: number) => {
    let sn = SideNumber.slice()
    sn[i] = v
    setSelectionCombined(sn)
  }
  const Undo = () => { socket.emit("undo") };
  const Redo = () => { socket.emit("redo") };

  React.useEffect(() => {
    //Only run once
    socket.emit("key", gameKeyId);
    socket.emit("newgame", newGamePending)
    socket.on("clue", (clue) => {
      console.log("clue", clue)
      setClue(clue)
    })
    socket.on("state", (state) => {
      console.log("state", state)
      setState(state)
    })
    socket.on("selection", (selection) => {
      console.log("selection", selection)
      setSelection(selection)
    })
    socket.on("sidenumber", (sidenumber) => {
      console.log("sidenumber", sidenumber)
      setSideNumber(sidenumber)
    })
    socket.on("pending", (pending) => {
      console.log("pending", pending)
      setPendingStatus(pending)
    })
    socket.on("resetPending", () => {
      console.log("resetPending")
      setNewGamePendingCombined(false)
    })
    // setClue(initSudoku);
    // setState(undefined) //FIXME:Why not work?
    // setStateCombind({ Fillin: initFillin, Candid: initCandid });

  }, []);

  React.useEffect(() => {
    //Draw Sudoku board when state changes
    if (Clue && State)
      DrawSudoku(Clue, State, Selection, SideNumber, Options);
  }, [Clue, State, Selection, SideNumber, Options]);

  React.useEffect(() => {
    //Update states when number entered
    const onKeyDown = (e: KeyboardEvent) => {
      console.log(e.key, Selection);
      if (e.ctrlKey) {
        if (e.key === 'z')
          Undo()
        if (e.key === 'y')
          Redo()
        return
      }
      if (Selection.length === 1) {
        const row = Math.floor(Selection[0] / 9)
        const col = Selection[0] % 9
        console.log('(%d,%d)<-%s', row, col, e.key)
        const FillIn = (toFill: string) => {
          if (!State) return
          const newState = State.Fillin.split('')
          if (toFill === State.Fillin.charAt(Selection[0])) return
          newState[Selection[0]] = toFill
          setStateCombined({ Fillin: newState.join(''), Candid: State.Candid })
        }
        if (e.key.match(/[1-9]/)) {
          FillIn(e.key)
        }
        if (e.key === 'Backspace') {
          FillIn('.')
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [Selection, State]);

  if (State) {
    const occurence = getOccurence(Clue, State)
    occurence.forEach((v, i) => { if (v >= 9 && SideNumber[i] === 1) SetSideNumberTo(i, 0) })
    const completed = occurence.every((v) => v >= 9) && computeError(getBoardFrom(Clue, State.Fillin)).size === 0
    let newGameMsg = "New Game"
    if (pendingStatus[0] > 0)
      newGameMsg = "New Game (" + pendingStatus[0] + "/" + pendingStatus[1] + ")"
    return (<>
      <Container sx={{ display: "flex", flexDirection: "column", justifyContent: 'space-evenly', my: 10 }} maxWidth="md">
        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: 'space-evenly' }}>
          {
            Options.advMode ? (<>
              <Button variant="outlined" onClick={(e) => { }} disabled={true}>Auto-fill candiates</Button>
              <Button variant="outlined" onClick={(e) => { }} disabled={true}>Notes {NotesOn ? "on" : "off"}</Button></>) : null
          }

          <Button variant="outlined" onClick={(e) => { Undo() }}>Undo</Button>
          <Button variant="outlined" onClick={(e) => { Redo() }}>Redo</Button>
          <Button variant="outlined" onClick={(e) => { }} disabled={true}>Hint</Button>
          <Button variant={newGamePending ? "outlined" : completed ? "contained" : "text"} onClick={(e) => {
            setNewGamePendingCombined(!newGamePending)
          }} color="success">{newGameMsg}</Button>
        </Box>
        <Container sx={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
          <Box>
            <canvas id="canvas" width="500" height="500" onClick={(e) => {
              const canvas = document.getElementById('canvas') as HTMLCanvasElement;
              const rect = canvas.getBoundingClientRect();
              let col = Math.floor((e.clientX - 25 - rect.left) / 50)
              let row = Math.floor((e.clientY - 25 - rect.top) / 50)
              console.log(row, col)
              if (row < 0 || row > 8 || col < 0 || col > 8) {
                setSelectionCombined([])
                return
              }
              if (Selection.length === 1 && Selection[0] === row * 9 + col)
                setSelectionCombined([])
              else
                setSelectionCombined([row * 9 + col])
              setSideNumberCombined(Array(9).fill(0))
            }}></canvas>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: 'space-evenly' }}>
            {Array(9).fill(0).map((_, i) => (<Button
              variant={SideNumber[i] === 1 ? "contained" : "outlined"}
              key={i}
              sx={{ p: 2, m: 0, height: 50, minWidth: 50, }}
              disabled={occurence[i] >= 9}
              onClick={(e) => {
                const sn = Array(9).fill(0)
                sn[i] = 1 - SideNumber[i]
                setSideNumberCombined(sn)
                setSelectionCombined([])
              }}>{i + 1}</Button>))}
          </Box>
        </Container>
      </Container >
    </>
    )
  }
  return <>Loading...</>
}
// const initSudoku = ".472.1.....9....2..2.9..17.6...547....5.2.6....316...9.31..7.4..5....3.....6.359."
const initFillin = "................................................................................."
const initCandid = ""
export default function Game() {

  const [Options, setOptions] = React.useState({ advMode: false, autoClear: false, autoFill: false, warn: false, affected: true, affectedSameNumber: true })

  return (<>
    {Sudoku(Options)}
    {TempDrawer(Options, setOptions)}
  </>)
}
// DrawSudoku(initSudoku)

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();

socket.on("connect", () => {
  console.log("connected")
});
socket.on("log", (log) => { console.log(log) })