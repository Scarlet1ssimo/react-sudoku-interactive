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
import { stringify } from 'querystring';

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
  const [Clue, setClue] = React.useState<string>(initSudoku);
  // const [State, setState] = React.useState<SudokuState>({ Fillin: initFillin, Candid: "" });
  const [Selection, setSelection] = React.useState<number[]>([]);
  const [SideNumber, setSideNumber] = React.useState<number[]>(Array(9).fill(0));
  const [NotesOn, setNotesOn] = React.useState(false)
  const [HistoryStack, setHistoryStack] = React.useState<{ Stack: SudokuState[], Top: number } | undefined>(undefined);
  // const State = React.useMemo(() => {HistoryStack?.Stack[HistoryStack?.Top] || null}, [HistoryStack])
  // const State = HistoryStack?.Stack[HistoryStack?.Top] || null
  console.log("in", HistoryStack)

  const SetSideNumberTo = (i: number, v: number) => {
    let sn = SideNumber.slice()
    sn[i] = v
    setSideNumber(sn)
  }

  const AddState = (State: SudokuState) => {
    setHistoryStack((HistoryStack) => {
      console.log("AddState:", HistoryStack)
      if (HistoryStack) {
        const top = HistoryStack.Top
        if (HistoryStack.Stack[top].Fillin === State.Fillin && HistoryStack.Stack[top].Candid === State.Candid) return
        return { Stack: [...HistoryStack.Stack.slice(0, top + 1), State], Top: top + 1 }
      } else {
        return { Stack: [State], Top: 0 }
      }
    })
  }

  function Undo() {
    setHistoryStack((HistoryStack) => {
      if (!HistoryStack) return HistoryStack
      if (HistoryStack?.Top > 0) {
        return { Stack: HistoryStack.Stack, Top: HistoryStack.Top - 1 }
      }
      return HistoryStack
    })
  }

  function Redo() {
    setHistoryStack((HistoryStack) => {
      if (!HistoryStack) return HistoryStack
      if (HistoryStack.Top < HistoryStack.Stack.length - 1) {
        return { Stack: HistoryStack.Stack, Top: HistoryStack.Top + 1 }
      }
      return HistoryStack
    })
  }

  React.useEffect(() => {
    //Only run once
    setClue(initSudoku);
    setHistoryStack(undefined) //FIXME:Why not work?
    AddState({ Fillin: initFillin, Candid: initCandid });
  }, []);

  React.useEffect(() => {
    //Draw Sudoku board when state changes
    if (!HistoryStack) return
    const State = HistoryStack?.Stack[HistoryStack?.Top]
    DrawSudoku(Clue, State, Selection, SideNumber, Options);
  }, [Clue, HistoryStack, Selection, SideNumber, Options]);

  React.useEffect(() => {
    //Update states when number entered
    const onKeyDown = (e: KeyboardEvent) => {
      console.log(e.key, Selection);
      if (e.ctrlKey && e.key === 'z') {
        Undo()
        return
      }
      if (e.ctrlKey && e.key === 'y') {
        Redo()
        return
      }
      if (Selection.length === 1) {
        const row = Math.floor(Selection[0] / 9)
        const col = Selection[0] % 9
        console.log('(%d,%d)<-%s', row, col, e.key)
        const FillIn = (e: string) => {
          if (!HistoryStack) return
          const State = HistoryStack.Stack[HistoryStack.Top]
          const newState = State.Fillin.split('')
          if (e === State.Fillin.charAt(Selection[0])) return
          newState[Selection[0]] = e
          AddState({ Fillin: newState.join(''), Candid: State.Candid })
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
  }, [Selection, HistoryStack]);

  if (HistoryStack) {
    const State = HistoryStack.Stack[HistoryStack.Top]
    const occurence = getOccurence(Clue, State)
    occurence.forEach((v, i) => { if (v >= 9 && SideNumber[i] === 1) SetSideNumberTo(i, 0) })
    const completed = occurence.every((v) => v >= 9) && computeError(getBoardFrom(Clue, State.Fillin)).size === 0
    return (<>
      <Container sx={{ display: "flex", flexDirection: "column", justifyContent: 'space-evenly', my: 10 }} maxWidth="md">
        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: 'space-evenly' }}>
          {
            Options.advMode ? (<>
              <Button variant="outlined" onClick={(e) => { }} disabled={true}>Auto-fill candiates</Button>
              <Button variant="outlined" onClick={(e) => { }} disabled={true}>Notes {NotesOn ? "on" : "off"}</Button></>) : null
          }

          <Button variant="outlined" onClick={(e) => { Undo() }} disabled={HistoryStack?.Top === 0}>Undo</Button>
          <Button variant="outlined" onClick={(e) => { Redo() }} disabled={HistoryStack && HistoryStack?.Top === HistoryStack?.Stack.length - 1}>Redo</Button>
          <Button variant="outlined" onClick={(e) => { }} disabled={true}>Hint</Button>
          <Button variant={completed ? "contained" : "outlined"} onClick={(e) => {
            setClue(initSudoku)
            setHistoryStack(undefined)
            AddState({ Fillin: initFillin, Candid: initCandid })
          }} color="success">New Game</Button>
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
                setSelection([])
                return
              }

              setSelection((Selection) => {
                if (Selection.length === 1 && Selection[0] === row * 9 + col) {
                  return []
                }
                return [row * 9 + col]
              })
              setSideNumber(Array(9).fill(0))
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
                setSideNumber(sn)
                setSelection([])
              }}>{i + 1}</Button>))}
          </Box>
        </Container>
      </Container >
    </>
    )
  }
  return <>Loading...</>
}
const initSudoku = ".472.1.....9....2..2.9..17.6...547....5.2.6....316...9.31..7.4..5....3.....6.359."
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