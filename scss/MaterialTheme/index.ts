import { createTheme } from '@mui/material/styles';
export const theme = createTheme({
	palette: {
		primary: { main: '#1e5741' },
		background: { default: '#f5f3ec', paper: '#ffffff' },
		text: { primary: '#15201a', secondary: '#5b645d' },
	},
	typography: { fontFamily: 'var(--font-hanken), "Hanken Grotesk", "Pretendard Variable", Arial, sans-serif' },
	shape: { borderRadius: 6 },
});
