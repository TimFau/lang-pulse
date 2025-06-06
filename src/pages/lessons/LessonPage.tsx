import { useParams } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'css/pages/lesson.scss';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Typography,
} from '@mui/material';
import { LESSON_CORE_FIELDS } from '../../services/graphql/fragments/lessonFragments';

const GET_LESSON = gql`
  query GetLesson($language: String!, $slug: String!) {
    lessons(filter: { language: { _eq: $language }, slug: { _eq: $slug } }) {
      ...LessonCoreFields
      body
      deck_link
    }
  }
  ${LESSON_CORE_FIELDS}
`;

export default function LessonPage() {
  const { language, slug } = useParams();
  const { loading, error, data } = useQuery(GET_LESSON, {
    variables: { language, slug },
    skip: !language || !slug,
  });

  if (loading) {
    return <div className="article-loading">Loading...</div>;
  }
  if (error) {
    return <div className="article-error">Error loading article.</div>;
  }
  const lesson = data?.lessons?.[0];
  if (!lesson) {
    return <div className="article-not-found">Not Found</div>;
  }
  return (
    <Box className="lesson-page-container">
      <Container maxWidth="md">
        <Card className="lesson-page-card">
          <CardMedia
            component="img"
            className="lesson-page-media"
            image={
              lesson.main_image
                ? `${import.meta.env.VITE_API_BASE?.replace(
                    '/graphql',
                    ''
                  )}/assets/${lesson.main_image.id}`
                : 'https://via.placeholder.com/1200x400'
            }
            alt={lesson.title}
          />
          <CardContent className="lesson-page-content">
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              className="lesson-page-title"
            >
              {lesson.title}
            </Typography>
            <Box className="lesson-page-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lesson.body}
              </ReactMarkdown>
            </Box>
            <Box className="lesson-page-footer">
              {lesson.deck_link && (
                <Button
                  className="lesson-page-cta"
                  href={lesson.deck_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                >
                  Go to Deck
                </Button>
              )}
              <Typography component="p" className="lesson-page-disclaimer">
                Note: This lesson was created with the help of AI and reviewed
                for clarity and usefulness. While not written by a native
                speaker, it's designed as a helpful guide for beginners. For
                professional or academic use, we recommend supplementing with
                native-level resources.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
} 