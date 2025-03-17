type GetHealthApiResponse = 'ok';

export type GetHealthApi = {
    /**
     * Returns the health status of the node ("ok" if healthy).
     */
    getHealth(): GetHealthApiResponse;
};
