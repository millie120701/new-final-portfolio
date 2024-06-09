import pandas as pd


def generate_sudoku(difficulty):
    df = pd.read_pickle(f'../sudoku_game/{difficulty}.pkl')

    # random row

    sudoku = df.sample(1)

    puzzle_string = sudoku['quizzes'].iloc[0]
    solution_string = sudoku['solutions'].iloc[0]

    sudoku_board = []

    # build board from string

    for i in range(0, len(puzzle_string), 9):
        sudoku_board.append([*puzzle_string[i:i+9]])

    solution_board = []

    for i in range(0, len(solution_string), 9):
        solution_board.append([*solution_string[i:i+9]])

    return sudoku_board, solution_board
