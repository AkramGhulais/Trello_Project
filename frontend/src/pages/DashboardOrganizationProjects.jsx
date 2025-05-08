import { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  CircularProgress, 
  Alert,
  Breadcrumbs,
  Link,
  Divider,
  Chip
} from '@mui/material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import FolderIcon from '@mui/icons-material/Folder';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinearProgress from '@mui/material/LinearProgress';
import axios from '../api/axios';

const DashboardOrganizationProjects = () => {
  const { user } = useContext(AuthContext);
  const { orgId } = useParams();
  const [organization, setOrganization] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // جلب معلومات المؤسسة
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/organizations/${orgId}/`);
        setOrganization(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError('حدث خطأ أثناء جلب معلومات المؤسسة. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    if (orgId) {
      fetchOrganization();
    }
  }, [orgId]);

  // جلب مشاريع المؤسسة
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/organizations/${orgId}/org_projects/`);
        setProjects(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('حدث خطأ أثناء جلب المشاريع. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    if (orgId) {
      fetchProjects();
    }
  }, [orgId]);

  // عرض تفاصيل المشروع
  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  if (loading && !organization) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // حساب نسبة اكتمال المشروع
  const getCompletionPercentage = (project) => {
    return project.completion_percentage || 0;
  };
  
  // تحديد لون شريط التقدم بناءً على نسبة الاكتمال
  const getProgressColor = (percentage) => {
    if (percentage < 30) return 'error';
    if (percentage < 70) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">
          لوحة التحكم
        </Link>
        <Typography color="text.primary">
          مشاريع {organization?.name || 'المؤسسة'}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" component="h1" sx={{ 
          fontWeight: 'bold', 
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <BusinessIcon />
          مشاريع {organization?.name || 'المؤسسة'}
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
        >
          العودة إلى لوحة التحكم
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {projects.map((project) => {
          const completionPercentage = getCompletionPercentage(project);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  boxShadow: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FolderIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                      {project.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: 'hidden' }}>
                    {project.description || 'لا يوجد وصف للمشروع'}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        نسبة الإنجاز
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {completionPercentage}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={completionPercentage} 
                      color={getProgressColor(completionPercentage)}
                      sx={{ height: 8, borderRadius: 5 }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Chip 
                      label={`${project.tasks_count || 0} مهمة`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      آخر تحديث: {new Date(project.updated_at).toLocaleDateString('ar-SA')}
                    </Typography>
                  </Box>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ p: 2 }}>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => handleViewProject(project.id)}
                  >
                    عرض المشروع
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
        
        {projects.length === 0 && !loading && (
          <Grid item xs={12}>
            <Alert severity="info">
              لا توجد مشاريع متاحة لهذه المؤسسة حالياً.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DashboardOrganizationProjects;
