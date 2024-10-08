import React from 'react';
import {
  ChartsProvider,
  generateChartsTheme,
  getTheme,
  PersesChartsTheme,
} from '@perses-dev/components';
import { ThemeProvider } from '@mui/material';
import {
  DataQueriesProvider,
  dynamicImportPluginLoader,
  PluginModuleResource,
  PluginRegistry,
  TimeRangeProvider,
  useDataQueries,
} from '@perses-dev/plugin-system';
import {
  DatasourceResource,
  Definition,
  DurationString,
  GlobalDatasourceResource,
  UnknownSpec,
} from '@perses-dev/core';
import panelsResource from '@perses-dev/panels-plugin/plugin.json';
import tempoResource from '@perses-dev/tempo-plugin/plugin.json';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DatasourceApi, DatasourceStoreProvider, VariableProvider } from '@perses-dev/dashboards';
import { TempoInstance } from '../hooks/useTempoInstance';
import { getProxyURLFor } from '../hooks/api';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorAlert } from './ErrorAlert';
import { NoTempoInstanceSelectedState } from './NoTempoInstanceSelectedState';
import { LoadingState } from './LoadingState';

class DatasourceApiImpl implements DatasourceApi {
  constructor(public proxyDatasource: GlobalDatasourceResource) {}

  getDatasource(): Promise<DatasourceResource | undefined> {
    return Promise.resolve(undefined);
  }
  getGlobalDatasource(): Promise<GlobalDatasourceResource | undefined> {
    return Promise.resolve(this.proxyDatasource);
  }
  listDatasources(): Promise<DatasourceResource[]> {
    return Promise.resolve([]);
  }
  listGlobalDatasources(): Promise<GlobalDatasourceResource[]> {
    return Promise.resolve([this.proxyDatasource]);
  }
  buildProxyUrl(): string {
    return '/';
  }
}

// Override eChart defaults with PatternFly colors.
const patternflyBlue300 = '#2b9af3';
const patternflyBlue400 = '#0066cc';
const patternflyBlue500 = '#004080';
const patternflyBlue600 = '#002952';
const defaultPaletteColors = [patternflyBlue400, patternflyBlue500, patternflyBlue600];

const muiTheme = getTheme('light');
muiTheme.shape.borderRadius = 0;

const chartsTheme: PersesChartsTheme = generateChartsTheme(muiTheme, {
  thresholds: {
    defaultColor: patternflyBlue300,
    palette: defaultPaletteColors,
  },
});

// PluginRegistry configuration to allow access to
// visualization panels/charts (@perses-dev/panels-plugin)
// and data handlers for tempo (@perses-dev/tempo-plugin).
const pluginLoader = dynamicImportPluginLoader([
  {
    resource: panelsResource as PluginModuleResource,
    importPlugin: () => import('@perses-dev/panels-plugin'),
  },
  {
    resource: tempoResource as PluginModuleResource,
    importPlugin: () => import('@perses-dev/tempo-plugin'),
  },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0,
    },
  },
});

interface PersesWrapperProps {
  tempo: TempoInstance | undefined;
  definitions: Definition<UnknownSpec>[];
  duration?: DurationString;
  children?: React.ReactNode;
}

export function PersesWrapper({
  tempo,
  definitions,
  duration = '0s',
  children,
}: PersesWrapperProps) {
  if (!tempo) {
    return <NoTempoInstanceSelectedState />;
  }

  const proxyDatasource: GlobalDatasourceResource = {
    kind: 'GlobalDatasource',
    metadata: { name: 'TempoProxy' },
    spec: {
      default: true,
      plugin: {
        kind: 'TempoDatasource',
        spec: {
          directUrl: getProxyURLFor(tempo),
        },
      },
    },
  };
  const datasourceApi = new DatasourceApiImpl(proxyDatasource);

  return (
    <ThemeProvider theme={muiTheme}>
      <ChartsProvider chartsTheme={chartsTheme}>
        <PluginRegistry pluginLoader={pluginLoader}>
          <QueryClientProvider client={queryClient}>
            <TimeRangeProvider timeRange={{ pastDuration: duration }}>
              <VariableProvider>
                <DatasourceStoreProvider datasourceApi={datasourceApi}>
                  <DataQueriesProvider definitions={definitions}>{children}</DataQueriesProvider>
                </DatasourceStoreProvider>
              </VariableProvider>
            </TimeRangeProvider>
          </QueryClientProvider>
        </PluginRegistry>
      </ChartsProvider>
    </ThemeProvider>
  );
}

interface TracePanelWrapperProps {
  noResults?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * TraceQueryPanelWrapper intercepts the trace query status and displays PatternFly native empty and loading states
 * instead of the Material UI empty and loading states used by Perses.
 */
export function TraceQueryPanelWrapper({ noResults, children }: TracePanelWrapperProps) {
  const { isFetching, isLoading, queryResults } = useDataQueries('TraceQuery');

  if (isLoading || isFetching) {
    return <LoadingState />;
  }

  const queryError = queryResults.find((d) => d.error);
  if (queryError) {
    return <ErrorAlert error={queryError.error as Error} />;
  }

  const dataFound = queryResults.some(
    (traceData) => (traceData.data?.searchResult ?? []).length > 0 || traceData.data?.trace,
  );
  if (!dataFound && noResults) {
    return <>{noResults}</>;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorAlert} resetKeys={[]}>
      {children}
    </ErrorBoundary>
  );
}
