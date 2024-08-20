import React from 'react';
import { TraceQueryPanelWrapper } from '../../components/PersesWrapper';
import { TraceTable as PersesTraceTable } from '@perses-dev/panels-plugin';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Title,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

interface TraceTableProps {
  setQuery: (query: string) => void;
}

export function TraceTable({ setQuery }: TraceTableProps) {
  const { t } = useTranslation('plugin__distributed-tracing-console-plugin');

  const noResults = (
    <Bullseye>
      <EmptyState>
        <EmptyStateIcon icon={SearchIcon} />
        <Title headingLevel="h2" size="lg">
          {t('No results found')}
        </Title>
        <EmptyStateBody>{t('Clear all filters and try again.')}</EmptyStateBody>
        <Button variant="link" onClick={() => setQuery('{}')}>
          {t('Clear all filters')}
        </Button>
      </EmptyState>
    </Bullseye>
  );

  return (
    <TraceQueryPanelWrapper noResults={noResults}>
      <PersesTraceTable.PanelComponent spec={{}} traceLink={traceDetailLink} />
    </TraceQueryPanelWrapper>
  );
}

export function traceDetailLink({ traceId }: { traceId: string }) {
  return `/observe/traces/${traceId}?${new URLSearchParams(window.location.search).toString()}`;
}