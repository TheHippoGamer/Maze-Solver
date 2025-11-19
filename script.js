const mazeContainer = document.getElementById('maze-container');
const generateButton = document.getElementById('generate-maze');
const solveButton = document.getElementById('solve-maze');
const mazeSizeInput = document.getElementById('maze-size');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const html = document.documentElement;
const settingsToggle = document.getElementById('settings-toggle');
const settingsMenu = document.getElementById('settings-menu');
const algorithmSelect = document.getElementById('algorithm-select');
const raceModeCheckbox = document.getElementById('race-mode');
const raceResults = document.getElementById('race-results');

let MAZE_SIZE = 51;
let currentMaze;

function toggleDarkMode() {
    html.classList.toggle('dark-mode');
}

darkModeToggle.addEventListener('click', toggleDarkMode);

function generateMaze() {
    const maze = Array(MAZE_SIZE).fill().map(() => Array(MAZE_SIZE).fill(1));
    const stack = [[1, 1]];

    maze[1][1] = 0;

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const directions = [
            [0, -2], [0, 2], [-2, 0], [2, 0]
        ].sort(() => Math.random() - 0.5);

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx > 0 && nx < MAZE_SIZE - 1 && ny > 0 && ny < MAZE_SIZE - 1 && maze[ny][nx] === 1) {
                maze[y + dy / 2][x + dx / 2] = 0;
                maze[ny][nx] = 0;
                stack.push([nx, ny]);
            }
        }
    }

    maze[0][1] = 2; // Entrance
    maze[MAZE_SIZE - 1][MAZE_SIZE - 2] = 3; // Exit

    return maze;
}

function renderMaze(maze, container) {
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${MAZE_SIZE}, 10px)`;

    for (let y = 0; y < MAZE_SIZE; y++) {
        for (let x = 0; x < MAZE_SIZE; x++) {
            const cell = document.createElement('div');
            cell.id = `cell-${container.id}-${y}-${x}`;
            cell.className = 'cell';
            if (maze[y][x] === 1) {
                cell.classList.add('wall');
            } else {
                cell.classList.add('path');
            }
            container.appendChild(cell);
        }
    }
}

function createNewMaze() {
    MAZE_SIZE = parseInt(mazeSizeInput.value);
    if (MAZE_SIZE % 2 === 0) MAZE_SIZE++;
    
    currentMaze = generateMaze(); // Generate a single maze for both modes

    mazeContainer.innerHTML = ''; // Clear the container regardless of mode

    if (raceModeCheckbox.checked) {
        for (let i = 0; i < 3; i++) {
            const mazeDiv = document.createElement('div');
            mazeDiv.classList.add('maze');
            mazeDiv.id = `maze-${i}`;
            mazeContainer.appendChild(mazeDiv);
            renderMaze(currentMaze, mazeDiv);
        }
    } else {
        const mazeDiv = document.createElement('div');
        mazeDiv.classList.add('maze');
        mazeDiv.id = 'maze-0';
        mazeContainer.appendChild(mazeDiv);
        renderMaze(currentMaze, mazeDiv);
    }
}

function toggleSettings() {
    settingsMenu.classList.toggle('hidden');
}

settingsToggle.addEventListener('click', toggleSettings);

async function solveMaze() {
    if (raceModeCheckbox.checked) {
        const algorithms = ['bfs', 'dfs', 'astar'];
        const solvingPromises = algorithms.map((algorithm, index) => {
            const mazeDiv = document.getElementById(`maze-${index}`);
            return solveMazeWithAlgorithm(currentMaze, algorithm, mazeDiv);
        });

        const startTime = performance.now();
        const solutions = await Promise.all(solvingPromises);
        const endTime = performance.now();

        const results = algorithms.map((algorithm, index) => ({
            algorithm,
            time: (endTime - startTime) / 1000,
            steps: solutions[index] ? solutions[index].length : 0
        }));

        displayRaceResults(results);
    } else {
        if (!currentMaze) return;
        const algorithm = algorithmSelect.value;
        const mazeDiv = document.getElementById('maze-0');
        await solveMazeWithAlgorithm(currentMaze, algorithm, mazeDiv);
    }
}

function extractMazeFromDOM(container) {
    const maze = Array(MAZE_SIZE).fill().map(() => Array(MAZE_SIZE).fill(1));
    for (let y = 0; y < MAZE_SIZE; y++) {
        for (let x = 0; x < MAZE_SIZE; x++) {
            const cell = document.getElementById(`cell-${container.id}-${y}-${x}`);
            if (cell.classList.contains('path') || cell.classList.contains('entrance') || cell.classList.contains('exit')) {
                maze[y][x] = 0;
            }
        }
    }
    maze[0][1] = 2; // Entrance
    maze[MAZE_SIZE - 1][MAZE_SIZE - 2] = 3; // Exit
    return maze;
}

async function solveMazeWithAlgorithm(maze, algorithm, container) {
    let solution;
    switch (algorithm) {
        case 'dfs':
            solution = depthFirstSearch(maze);
            break;
        case 'astar':
            solution = aStarSearch(maze);
            break;
        case 'bfs':
        default:
            solution = breadthFirstSearch(maze);
            break;
    }

    if (solution) {
        for (let i = 0; i < solution.length; i++) {
            const [y, x] = solution[i];
            let cell;
            if (container.id === 'maze-container') {
                // Normal mode
                cell = document.getElementById(`cell-maze-0-${y}-${x}`);
            } else {
                // Race mode
                cell = document.getElementById(`cell-${container.id}-${y}-${x}`);
            }
            if (cell) {
                cell.classList.add('solution');
                await new Promise(resolve => setTimeout(resolve, 25));
            }
        }
    }

    return solution;
}

function displayRaceResults(results) {
    raceResults.innerHTML = '<h2>Race Results</h2>';
    results.forEach(result => {
        raceResults.innerHTML += `
            <p>${result.algorithm.toUpperCase()}: 
            Time: ${result.time.toFixed(3)}s, 
            Steps: ${result.steps}</p>
        `;
    });
}

function breadthFirstSearch(maze) {
    const start = [0, 1];
    const end = [MAZE_SIZE - 1, MAZE_SIZE - 2];
    const queue = [[start]];
    const visited = new Set();
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    while (queue.length > 0) {
        const path = queue.shift();
        const [y, x] = path[path.length - 1];

        if (y === end[0] && x === end[1]) {
            return path;
        }

        for (const [dy, dx] of directions) {
            const ny = y + dy;
            const nx = x + dx;
            const key = `${ny},${nx}`;

            if (ny >= 0 && ny < MAZE_SIZE && nx >= 0 && nx < MAZE_SIZE &&
                maze[ny][nx] !== 1 && !visited.has(key)) {
                const newPath = [...path, [ny, nx]];
                queue.push(newPath);
                visited.add(key);
            }
        }
    }

    return null;
}

function depthFirstSearch(maze) {
    const start = [0, 1];
    const end = [MAZE_SIZE - 1, MAZE_SIZE - 2];
    const stack = [[start]];
    const visited = new Set();
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    while (stack.length > 0) {
        const path = stack.pop();
        const [y, x] = path[path.length - 1];

        if (y === end[0] && x === end[1]) {
            return path;
        }

        for (const [dy, dx] of directions) {
            const ny = y + dy;
            const nx = x + dx;
            const key = `${ny},${nx}`;

            if (ny >= 0 && ny < MAZE_SIZE && nx >= 0 && nx < MAZE_SIZE &&
                maze[ny][nx] !== 1 && !visited.has(key)) {
                visited.add(key);
                stack.push([...path, [ny, nx]]);
            }
        }
    }

    return null;
}

function aStarSearch(maze) {
    const start = [0, 1];
    const end = [MAZE_SIZE - 1, MAZE_SIZE - 2];
    const openSet = new PriorityQueue();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    openSet.enqueue(start, 0);
    gScore.set(start.toString(), 0);
    fScore.set(start.toString(), heuristic(start, end));

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();

        if (current[0] === end[0] && current[1] === end[1]) {
            return reconstructPath(cameFrom, current);
        }

        for (const [dy, dx] of directions) {
            const neighbor = [current[0] + dy, current[1] + dx];
            const [ny, nx] = neighbor;

            if (ny >= 0 && ny < MAZE_SIZE && nx >= 0 && nx < MAZE_SIZE && maze[ny][nx] !== 1) {
                const tentativeGScore = gScore.get(current.toString()) + 1;

                if (!gScore.has(neighbor.toString()) || tentativeGScore < gScore.get(neighbor.toString())) {
                    cameFrom.set(neighbor.toString(), current);
                    gScore.set(neighbor.toString(), tentativeGScore);
                    fScore.set(neighbor.toString(), tentativeGScore + heuristic(neighbor, end));

                    if (!openSet.contains(neighbor)) {
                        openSet.enqueue(neighbor, fScore.get(neighbor.toString()));
                    }
                }
            }
        }
    }

    return null;
}

function heuristic(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom.has(current.toString())) {
        current = cameFrom.get(current.toString());
        path.unshift(current);
    }
    return path;
}

class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.elements.shift().element;
    }

    isEmpty() {
        return this.elements.length === 0;
    }

    contains(element) {
        return this.elements.some(item => item.element[0] === element[0] && item.element[1] === element[1]);
    }
}

generateButton.addEventListener('click', createNewMaze);
solveButton.addEventListener('click', solveMaze);
raceModeCheckbox.addEventListener('change', createNewMaze);

// Generate initial maze
createNewMaze();
