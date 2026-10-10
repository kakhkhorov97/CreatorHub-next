import { createTheme } from '@mui/material/styles';
export const theme = createTheme({
	palette: {
		primary: { main: '#245c46' },
		background: { default: '#f7f5f0', paper: '#ffffff' },
		text: { primary: '#202722', secondary: '#5d665f' },
	},
	typography: { fontFamily: 'Arial, Helvetica, sans-serif' },
	shape: { borderRadius: 6 },
});
