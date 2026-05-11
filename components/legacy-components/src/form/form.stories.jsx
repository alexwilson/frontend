import Form, { Input, TextArea, Submit, InlineGroup } from '.'

export default {
  title: 'Legacy/Form',
  component: Form,
}

export const Default = {
  render: () => (
    <Form>
      <Input type="text" placeholder="Your name" />
      <Input type="email" placeholder="Your email" />
      <TextArea placeholder="Your message" />
      <Submit value="Send" />
    </Form>
  ),
}

export const WithInlineGroup = {
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

export const JustInput = {
  render: () => <Input type="text" placeholder="Standalone input" />,
}

export const JustSubmit = {
  render: () => <Submit value="Subscribe" />,
}
