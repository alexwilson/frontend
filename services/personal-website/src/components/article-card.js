import React from 'react';
import { ArticleCard } from '@alexwilson/legacy-components/src/article-card';
import { Link } from 'gatsby';

export default (props) => <ArticleCard linkImplementation={Link} {...props} />
