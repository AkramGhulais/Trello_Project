import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, Box, Typography, Button, Paper
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';

const NotFound = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 5, 
          textAlign: 'center',
          borderRadius: 4,
          boxShadow: theme => `0 8px 24px ${theme.palette.primary.light}25`
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 100, color: 'primary.main', mb: 3 }} />
        
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          404
        </Typography>
        
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          الصفحة غير موجودة
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها أو حذفها.
        </Typography>
        
        <Button 
          component={RouterLink} 
          to="/"
          variant="contained" 
          size="large"
          startIcon={<HomeIcon />}
          sx={{ px: 4, py: 1.5 }}
        >
          العودة إلى الرئيسية
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFound;
