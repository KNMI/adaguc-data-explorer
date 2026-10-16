import { extractServiceErrorMessage } from './extractServiceErrorMessage';

describe('extractServiceErrorMessage', () => {
  it('extracts the message from an OGC ServiceExceptionReport', () => {
    const xml = `<?xml version='1.0' encoding="ISO-8859-1" standalone="no" ?>
<ServiceExceptionReport version="1.3.0">
  <ServiceException code="UnprocessableEntity">
    Requested data exceeded maxquerylimit=512;
    Exception in setDimValuesForDataSource for layer air_temperature_hagl with ServiceExceptionType=UnprocessableEntity;
  </ServiceException>
</ServiceExceptionReport>`;

    expect(extractServiceErrorMessage(xml)).toBe(
      'Requested data exceeded maxquerylimit=512;\n    Exception in setDimValuesForDataSource for layer air_temperature_hagl with ServiceExceptionType=UnprocessableEntity;',
    );
  });

  it('falls back to the raw text when it does not look like XML', () => {
    expect(extractServiceErrorMessage('Internal Server Error')).toBe(
      'Internal Server Error',
    );
  });

  it('falls back to the raw text when the XML has no recognisable exception element', () => {
    const xml = '<SomethingElse>not an OGC exception</SomethingElse>';
    expect(extractServiceErrorMessage(xml)).toBe(xml);
  });

  it('returns a placeholder message for an empty response', () => {
    expect(extractServiceErrorMessage('   ')).toBe(
      'The server returned an empty error response.',
    );
  });
});
