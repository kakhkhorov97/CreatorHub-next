import { createTheme } from '@mui/material/styles';
export const theme = createTheme({
	palette: {
		primary: { main: '#0859ec' },
		background: { default: '#fdfcfb', paper: '#ffffff' },
		text: { primary: '#0b1020', secondary: '#626878' },
	},
	typography: { fontFamily: 'Arial, Helvetica, sans-serif' },
	shape: { borderRadius: 6 },
});
