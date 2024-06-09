import pandas as pd


df = pd.read_csv(
    "/Users/milliegallacher/code/new-final-portfolio/sudoku_game/sudoku_cluewise.csv")


# filtered_df = df[(df['clue_numbers'] >= 25) & (df['clue_numbers'] < 30)]
# filtered_df.to_pickle('hard.pkl')


filtered_df = df[(df['clue_numbers'] > 40) & (df['clue_numbers'] <= 45)]
filtered_df.to_pickle('easy.pkl')


filtered_df = df[(df['clue_numbers'] >= 35) & (df['clue_numbers'] < 40)]
filtered_df.to_pickle('medium.pkl')
