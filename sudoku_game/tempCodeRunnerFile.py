filtered_df = df[(df['clue_numbers'] > 40) & (df['clue_numbers'] <= 45)]
filtered_df.to_pickle('easy.pkl')


filtered_df = df[(df['clue_numbers'] >= 35) & (df['clue_numbers'] < 40)]
filtered_df.to_pickle('medium.pkl')
