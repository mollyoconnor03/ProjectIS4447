import React from 'react';
import { render } from '@testing-library/react-native';
import FormField from '../components/ui/form-field';

describe('FormField', () => {
  it('renders the label text', () => {
    const { getByText } = render(
      <FormField label="Email" value="" onChangeText={() => {}} />
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('renders the input with the correct value', () => {
    const { getByDisplayValue } = render(
      <FormField label="Email" value="test@example.com" onChangeText={() => {}} />
    );
    expect(getByDisplayValue('test@example.com')).toBeTruthy();
  });

  it('renders an error message when error prop is provided', () => {
    const { getByText } = render(
      <FormField label="Email" value="" onChangeText={() => {}} error="Email is required." />
    );
    expect(getByText('Email is required.')).toBeTruthy();
  });

  it('does not render an error message when no error is provided', () => {
    const { queryByText } = render(
      <FormField label="Email" value="" onChangeText={() => {}} />
    );
    expect(queryByText('Email is required.')).toBeNull();
  });
});
