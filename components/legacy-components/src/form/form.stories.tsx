import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Form, { Input, TextArea, Submit, InlineGroup } from '.'

const meta: Meta<typeof Form> = {
  title: 'Legacy/Molecules/Form',
  component: Form,
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Form>
      <Input type="text" placeholder="Your name" />
      <Input type="email" placeholder="Your email" />
      <TextArea placeholder="Your message" />
      <Submit value="Send" />
    </Form>
  ),
}

export const WithInlineGroup: Story = {
  render: () => (
    <Form>
      <InlineGroup>
        <Input type="text" placeholder="First name" />
        <Input type="text" placeholder="Last name" />
      </InlineGroup>
      <Submit />
    </Form>
  ),
}

export const JustInput: Story = {
  render: () => <Input type="text" placeholder="Standalone input" />,
}

export const JustSubmit: Story = {
  render: () => <Submit value="Subscribe" />,
}
