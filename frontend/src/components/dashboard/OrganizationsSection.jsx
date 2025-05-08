import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from '../../api/axios';

const OrganizationsSection = ({ token }) => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orgStats, setOrgStats] = useState({});
  const navigate = useNavigate();

  // جلب جميع المؤسسات
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/organizations/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOrganizations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('حدث خطأ أثناء جلب المؤسسات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // جلب الإحصائيات لكل مؤسسة
  const fetchOrganizationStats = async () => {
    const stats = {};
    
    for (const org of organizations) {
      try {
        // جلب المشاريع
        const projectsResponse = await axios.get(`/api/organizations/${org.id}/org_projects/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // جلب المستخدمين
        const usersResponse = await axios.get(`/api/users/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // حساب عدد المستخدمين في هذه المؤسسة
        const orgUsers = usersResponse.data.filter(user => user.organization === org.id);
        
        // حساب عدد المهام
        let tasksCount = 0;
        let completedTasksCount = 0;
        
        // جلب المهام لكل مشروع
        for (const project of projectsResponse.data) {
          try {
            const tasksResponse = await axios.get(`/api/projects/${project.id}/tasks/`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            tasksCount += tasksResponse.data.length;
            completedTasksCount += tasksResponse.data.filter(task => task.status === 'completed').length;
          } catch (error) {
            console.error(`Error fetching tasks for project ${project.id}:`, error);
          }
        }
        
        stats[org.id] = {
          projectsCount: projectsResponse.data.length,
          usersCount: orgUsers.length,
          tasksCount: tasksCount,
          completedTasksCount: completedTasksCount
        };
      } catch (err) {
        console.error(`Error fetching stats for organization ${org.id}:`, err);
        stats[org.id] = {
          projectsCount: 0,
          usersCount: 0,
          tasksCount: 0,
          completedTasksCount: 0,
          error: true
        };
      }
    }
    
    setOrgStats(stats);
  };

  // تحميل البيانات عند تحميل المكون
  useEffect(() => {
    fetchOrganizations();
  }, [token]);

  // جلب الإحصائيات بعد تحميل المؤسسات
  useEffect(() => {
    if (organizations.length > 0) {
      fetchOrganizationStats();
    }
  }, [organizations, token]);

  // تصفية المؤسسات بناءً على البحث
  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // عرض مشاريع مؤسسة محددة
  const handleViewProjects = (orgId) => {
    navigate(`/dashboard/organizations/${orgId}/projects`);
  };

  // تحديث البيانات
  const handleRefresh = () => {
    fetchOrganizations();
  };

  if (loading && organizations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          المؤسسات
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="بحث عن مؤسسة..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          
          <Tooltip title="تحديث البيانات">
            <IconButton 
              color="primary" 
              onClick={handleRefresh}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {filteredOrganizations.map((org) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={org.id}>
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
                <Typography variant="h5" component="h2" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <BusinessIcon color="primary" />
                  {org.name}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">
                      المستخدمين: {orgStats[org.id]?.usersCount ?? <CircularProgress size={16} />}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FolderIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">
                      المشاريع: {orgStats[org.id]?.projectsCount ?? <CircularProgress size={16} />}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AssignmentIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">
                      المهام: {orgStats[org.id]?.tasksCount ?? <CircularProgress size={16} />}
                    </Typography>
                  </Box>
                  
                  {orgStats[org.id]?.tasksCount > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="body2">
                        المهام المنجزة: {orgStats[org.id]?.completedTasksCount ?? 0} / {orgStats[org.id]?.tasksCount ?? 0}
                        {' '}
                        ({Math.round((orgStats[org.id]?.completedTasksCount / orgStats[org.id]?.tasksCount) * 100)}%)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
              
              <CardActions sx={{ p: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => handleViewProjects(org.id)}
                  startIcon={<FolderIcon />}
                >
                  عرض المشاريع
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        {filteredOrganizations.length === 0 && !loading && (
          <Grid item xs={12}>
            <Alert severity="info">
              {searchQuery ? 'لا توجد مؤسسات تطابق البحث.' : 'لا توجد مؤسسات متاحة حالياً.'}
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default OrganizationsSection;
