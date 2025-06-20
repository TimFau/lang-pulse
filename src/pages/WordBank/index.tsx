import { useContext, useState } from 'react';
import { Container, Typography, Grid, Button, Box, CircularProgress } from '@mui/material';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SAVED_TERMS, DELETE_SAVED_TERM } from '../../queries';
import SavedTermCard from '../../components/SavedTermCard';
import AuthContext from '../../context/auth-context';
import { Navigate } from 'react-router-dom';
import { SavedTermResponse } from '../../types/SavedTerm';

const TERMS_PER_PAGE = 20;

const WordBankPage = () => {
  const authCtx = useContext(AuthContext);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { loading, error, data, fetchMore } = useQuery<SavedTermResponse>(GET_SAVED_TERMS, {
    variables: {
      limit: TERMS_PER_PAGE,
      offset: 0
    },
    skip: !authCtx.userToken,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    context: {
      headers: {
        authorization: `Bearer ${authCtx.userToken}`
      }
    },
    onCompleted: (data) => {
      setHasMore(data.saved_terms.length === TERMS_PER_PAGE);
    }
  });

  const [deleteTerm] = useMutation(DELETE_SAVED_TERM, {
    context: {
      headers: {
        authorization: `Bearer ${authCtx.userToken}`
      }
    },
    refetchQueries: [{ 
      query: GET_SAVED_TERMS, 
      variables: { limit: TERMS_PER_PAGE, offset: 0 }
    }]
  });

  const handleLoadMore = () => {
    const newOffset = offset + TERMS_PER_PAGE;
    setOffset(newOffset);
    fetchMore({
      variables: {
        offset: newOffset
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        setHasMore(fetchMoreResult.saved_terms.length === TERMS_PER_PAGE);
        return {
          saved_terms: [...prev.saved_terms, ...fetchMoreResult.saved_terms]
        };
      }
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTerm({
        variables: { id }
      });
    } catch (err) {
      console.error('Error deleting term:', err);
    }
  };

  if (!authCtx.userToken) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">Error loading your saved terms. Please try again later.</Typography>
      </Container>
    );
  }

  const savedTerms = data?.saved_terms || [];

  return (
    <Container className="word-bank-page">
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Word Bank
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage all your saved terms
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {savedTerms.map((term) => (
          <Grid item={true} key={term.id} xs={12} sm={6} md={4}>
            <SavedTermCard term={term} onDelete={handleDelete} />
          </Grid>
        ))}
      </Grid>

      {hasMore && (
        <Box mt={4} display="flex" justifyContent="center">
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default WordBankPage;